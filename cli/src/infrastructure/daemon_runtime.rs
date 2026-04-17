use std::collections::HashMap;
use std::sync::Arc;
use std::sync::Mutex;
use std::sync::mpsc::channel;
use std::time::Duration;

use anyhow::Result;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Path, Request, State};
use axum::http::{HeaderMap, HeaderValue, Method, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{any, get, post};
use axum::{Json, Router};
use futures_util::StreamExt;
use notify::{EventKind, RecursiveMode, Watcher};

use crate::core::app::AppContext;
use crate::domain::{apply, protocol};
use crate::infrastructure::ports::{ApplicationPorts, ConfigPort};
use crate::infrastructure::system::{
    SystemArchive, SystemFileSystem, SystemLinking, SystemLogger, SystemPorts,
};
use crate::paths;
use crate::utils::logging;

const DAEMON_ADDR: &str = "localhost:7967";
const ALLOWED_ORIGIN: &str = "https://xpui.app.spotify.com";

#[derive(Clone)]
struct DaemonState {
    ctx: AppContext,
    client: reqwest::Client,
    shutdown: Arc<tokio::sync::Notify>,
}

pub fn start(ctx: &AppContext) -> Result<()> {
    let shared_ctx = Arc::new(Mutex::new(ctx.clone()));

    let initial_stop = spawn_watcher(shared_ctx.clone());
    let config_ctx = ctx.clone();
    std::thread::spawn(move || watch_config_changes(&config_ctx, shared_ctx, initial_stop));

    let runtime = tokio::runtime::Runtime::new()?;
    runtime.block_on(async move {
        let shutdown = Arc::new(tokio::sync::Notify::new());
        let state = Arc::new(DaemonState {
            ctx: ctx.clone(),
            client: reqwest::Client::builder()
                .redirect(reqwest::redirect::Policy::none())
                .build()?,
            shutdown: shutdown.clone(),
        });

        let app = Router::new()
            .route("/rpc", get(ws_handler))
            .route("/shutdown", post(shutdown_handler))
            .route("/proxy/{*url}", any(proxy_handler))
            .with_state(state);

        let listener = tokio::net::TcpListener::bind(DAEMON_ADDR).await?;
        axum::serve(listener, app)
            .with_graceful_shutdown(async move {
                shutdown.notified().await;
            })
            .await?;
        Ok::<(), anyhow::Error>(())
    })?;

    Ok(())
}

fn spawn_watcher(shared_ctx: Arc<Mutex<AppContext>>) -> std::sync::mpsc::Sender<()> {
    let (stop_tx, stop_rx) = channel();
    std::thread::spawn(move || watch_spotify_apps(shared_ctx, stop_rx));
    stop_tx
}

fn watch_spotify_apps(shared_ctx: Arc<Mutex<AppContext>>, stop_rx: std::sync::mpsc::Receiver<()>) {
    let ctx = {
        match shared_ctx.lock() {
            Ok(g) => g.clone(),
            Err(_) => return,
        }
    };
    let apps = paths::spotify_apps_path(&ctx.spotify_data_path);
    let (tx, rx) = channel();
    let mut watcher = match notify::recommended_watcher(tx) {
        Ok(w) => w,
        Err(_) => return,
    };

    if watcher.watch(&apps, RecursiveMode::NonRecursive).is_err() {
        logging::fatal(&format!("failed to watch: {}", apps.display()));
        return;
    }

    logging::info(&format!("watching: {}", apps.display()));

    loop {
        if stop_rx.try_recv().is_ok() {
            logging::info("stopping");
            return;
        }

        match rx.recv_timeout(Duration::from_millis(200)) {
            Ok(Ok(event)) => {
                logging::info(&format!("event: {:?}", event.kind));
                if matches!(event.kind, EventKind::Create(_)) {
                    for p in event.paths {
                        if p.file_name().and_then(|s| s.to_str()) == Some("xpui.spa") {
                            let apply_ctx = {
                                match shared_ctx.lock() {
                                    Ok(g) => g.clone(),
                                    Err(_) => continue,
                                }
                            };
                            let fs = SystemFileSystem;
                            let archive = SystemArchive;
                            let linking = SystemLinking;
                            let logger = SystemLogger;
                            if let Err(err) =
                                apply::run_with(&apply_ctx, &fs, &archive, &linking, &logger)
                            {
                                logging::warn(&err.to_string());
                            }
                        }
                    }
                }
            }
            Ok(Err(err)) => {
                logging::warn(&err.to_string());
                continue;
            }
            Err(std::sync::mpsc::RecvTimeoutError::Timeout) => continue,
            Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => break,
        }
    }
}

fn watch_config_changes(
    ctx: &AppContext,
    shared_ctx: Arc<Mutex<AppContext>>,
    mut watcher_stop: std::sync::mpsc::Sender<()>,
) {
    let (tx, rx) = channel();
    let mut watcher = match notify::recommended_watcher(tx) {
        Ok(w) => w,
        Err(_) => return,
    };
    if watcher
        .watch(&ctx.config_file, RecursiveMode::NonRecursive)
        .is_err()
    {
        return;
    }

    loop {
        match rx.recv() {
            Ok(Ok(event)) => {
                if matches!(event.kind, EventKind::Modify(_) | EventKind::Create(_)) {
                    let ports = SystemPorts::default();
                    let Ok(new_ctx) = rebuild_context_from_config(ctx, ports.config()) else {
                        continue;
                    };

                    let old_data_path = {
                        match shared_ctx.lock() {
                            Ok(mut g) => {
                                let old = g.spotify_data_path.clone();
                                *g = new_ctx.clone();
                                old
                            }
                            Err(_) => continue,
                        }
                    };

                    if !new_ctx.daemon {
                        std::process::exit(0);
                    }

                    if new_ctx.spotify_data_path != old_data_path {
                        let _ = watcher_stop.send(());
                        watcher_stop = spawn_watcher(shared_ctx.clone());
                    }
                }
            }
            Ok(Err(err)) => {
                logging::warn(&err.to_string());
                continue;
            }
            Err(_) => break,
        }
    }
}

fn rebuild_context_from_config(base: &AppContext, config: &dyn ConfigPort) -> Result<AppContext> {
    let cfg = config.load_or_default(&base.config_file)?;

    let spotify_data_path = cfg
        .spotify_data_path
        .clone()
        .unwrap_or_else(paths::default_spotify_data_path);
    let spotify_exec_path = cfg
        .spotify_exec_path
        .clone()
        .unwrap_or_else(|| paths::default_spotify_exec_path(&spotify_data_path));
    let spotify_config_path = cfg
        .spotify_config_path
        .clone()
        .unwrap_or_else(paths::default_spotify_config_path);

    Ok(AppContext {
        config_file: base.config_file.clone(),
        config_path: base.config_path.clone(),
        daemon: cfg.daemon,
        mirror: cfg.mirror,
        spotify_data_path,
        spotify_exec_path,
        spotify_config_path,
    })
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<DaemonState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws(socket, state))
}

async fn shutdown_handler(State(state): State<Arc<DaemonState>>) -> impl IntoResponse {
    logging::info("shutdown requested");
    state.shutdown.notify_waiters();
    (StatusCode::ACCEPTED, "daemon stopping")
}

async fn handle_ws(mut socket: WebSocket, state: Arc<DaemonState>) {
    while let Some(Ok(msg)) = socket.next().await {
        if let Message::Text(text) = msg {
            logging::info(&format!("recv: {text}"));
            match protocol::handle_protocol(&state.ctx, &text) {
                Ok(res) if !res.is_empty() => {
                    let _ = socket.send(Message::Text(res.into())).await;
                }
                Ok(_) => {}
                Err(err) => logging::warn(&format!("protocol error: {err}")),
            }
        }
    }
}

async fn proxy_handler(
    State(state): State<Arc<DaemonState>>,
    Path(url): Path<String>,
    method: Method,
    headers: HeaderMap,
    request: Request,
) -> Response {
    if method == Method::OPTIONS {
        return cors_preflight();
    }

    let target = match url::Url::parse(&url) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, "invalid proxy url").into_response(),
    };

    let body = match axum::body::to_bytes(request.into_body(), usize::MAX).await {
        Ok(b) => b,
        Err(_) => return (StatusCode::BAD_REQUEST, "invalid request body").into_response(),
    };

    let mut upstream = state
        .client
        .request(method.clone(), target.clone())
        .body(body);

    for (name, value) in &headers {
        if name != "host" && name != "x-set-headers" {
            upstream = upstream.header(name, value);
        }
    }

    if let Some(raw) = headers.get("x-set-headers")
        && let Ok(raw) = raw.to_str()
        && let Ok(extra) = serde_json::from_str::<HashMap<String, String>>(raw)
    {
        for (k, v) in extra {
            if v == "undefined" {
                upstream = upstream.header(&k, "");
            } else {
                upstream = upstream.header(&k, v);
            }
        }
    }

    let upstream = match upstream.send().await {
        Ok(r) => r,
        Err(_) => return (StatusCode::BAD_GATEWAY, "proxy request failed").into_response(),
    };

    let status = upstream.status();
    let upstream_headers = upstream.headers().clone();
    let bytes = match upstream.bytes().await {
        Ok(b) => b,
        Err(_) => return (StatusCode::BAD_GATEWAY, "proxy body failed").into_response(),
    };

    let mut response = (status, bytes).into_response();
    let out_headers = response.headers_mut();
    apply_cors(out_headers);

    for (k, v) in &upstream_headers {
        out_headers.insert(k, v.clone());
    }

    if let Some(loc) = out_headers.get("location").and_then(|v| v.to_str().ok()) {
        let escaped = percent_encode(loc);
        let redirect = format!("http://{DAEMON_ADDR}/proxy/{escaped}");
        if let Ok(v) = HeaderValue::from_str(&redirect) {
            out_headers.insert("location", v);
        }
    }

    response
}

fn cors_preflight() -> Response {
    let mut headers = HeaderMap::new();
    apply_cors(&mut headers);
    headers.insert(
        "access-control-allow-methods",
        HeaderValue::from_static("GET, POST, PUT, DELETE, OPTIONS"),
    );
    headers.insert(
        "access-control-allow-headers",
        HeaderValue::from_static("content-type, x-set-headers"),
    );
    headers.insert("access-control-max-age", HeaderValue::from_static("86400"));
    (StatusCode::NO_CONTENT, headers, Json(serde_json::json!({}))).into_response()
}

fn apply_cors(headers: &mut HeaderMap) {
    headers.insert(
        "access-control-allow-origin",
        HeaderValue::from_static(ALLOWED_ORIGIN),
    );
    headers.insert(
        "access-control-allow-credentials",
        HeaderValue::from_static("true"),
    );
}

fn percent_encode(input: &str) -> String {
    url::form_urlencoded::byte_serialize(input.as_bytes()).collect::<String>()
}
