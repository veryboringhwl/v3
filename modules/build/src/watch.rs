use crate::builder::{parse_file_type, BuildOpts, Builder, FileType};
use anyhow::{Context, Result};
use notify::{Config, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::mpsc::{self, RecvTimeoutError};
use std::time::{Duration, Instant};

pub fn watch(builder: &Builder, debounce_ms: i64) -> Result<()> {
    println!("Watching for changes...");

    let (tx, rx) = mpsc::channel();
    let mut watcher = RecommendedWatcher::new(
        move |res| {
            let _ = tx.send(res);
        },
        Config::default(),
    )
    .context("Failed to initialize file watcher")?;

    watcher
        .watch(&builder.input_dir, RecursiveMode::Recursive)
        .with_context(|| {
            format!(
                "Failed to watch input directory: {}",
                builder.input_dir.display()
            )
        })?;

    let debounce_ms = if debounce_ms < 0 { 0 } else { debounce_ms as u64 };
    let debounce_duration = Duration::from_millis(debounce_ms);

    let mut opts = BuildOpts::default();

    loop {
        let event = rx.recv().context("File watcher channel closed")??;
        apply_event(&event, &mut opts, builder);

        let mut deadline = Instant::now() + debounce_duration;
        loop {
            let timeout = deadline.saturating_duration_since(Instant::now());
            match rx.recv_timeout(timeout) {
                Ok(event) => {
                    let event = event?;
                    apply_event(&event, &mut opts, builder);
                    deadline = Instant::now() + debounce_duration;
                }
                Err(RecvTimeoutError::Timeout) => break,
                Err(RecvTimeoutError::Disconnected) => {
                    return Err(anyhow::anyhow!("File watcher channel disconnected"));
                }
            }
        }

        if opts.js || opts.css {
            println!("Building...");
            builder.build(opts)?;
            reload_module(builder.identifier.as_str())?;
            opts.js = false;
            opts.css = false;
        }
    }
}

fn apply_event(event: &notify::Event, opts: &mut BuildOpts, builder: &Builder) {
    if !matches!(
        event.kind,
        EventKind::Modify(_) | EventKind::Create(_) | EventKind::Remove(_)
    ) {
        return;
    }

    for path in &event.paths {
        let rel = path.strip_prefix(&builder.input_dir).unwrap_or(path);
        match parse_file_type(path, rel) {
            FileType::ToJS => {
                opts.js = true;
                println!("Building {}...", path.display());
            }
            FileType::ToCSS => {
                opts.css = true;
                println!("Building {}...", path.display());
            }
            _ => continue,
        }
    }
}

fn reload_module(module: &str) -> Result<()> {
    let url = if module.is_empty() {
        "spotify:app:rpc:reload".to_string()
    } else {
        format!("spotify:app:rpc:reload?module={module}")
    };
    open::that(url).context("Failed to trigger spotify reload")?;
    Ok(())
}
