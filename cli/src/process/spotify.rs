use std::ffi::OsStr;
use std::process::Command;
use std::thread;
use std::time::{Duration, Instant};

use anyhow::{Context, Result};

use crate::app::AppContext;

const SHUTDOWN_TIMEOUT: Duration = Duration::from_secs(15);
const MIN_POLL_INTERVAL: Duration = Duration::from_millis(100);
const MAX_POLL_INTERVAL: Duration = Duration::from_millis(800);

pub fn start(ctx: &AppContext) -> Result<()> {
    start_spotify(ctx)?;
    crate::logging::info("Started Spotify");
    Ok(())
}

pub fn stop(ctx: &AppContext) -> Result<()> {
    crate::logging::info("Stopping Spotify (if running)");
    stop_spotify(ctx)?;
    wait_for_exit(ctx, SHUTDOWN_TIMEOUT);
    Ok(())
}

pub fn restart(ctx: &AppContext) -> Result<()> {
    stop(ctx)?;
    start(ctx)?;
    crate::logging::info("Restarted Spotify");
    Ok(())
}

pub fn restart_if_running(ctx: &AppContext) -> Result<()> {
    if !is_spotify_running(ctx) {
        return Ok(());
    }

    restart(ctx)
}

fn wait_for_exit(ctx: &AppContext, timeout: Duration) {
    let start = Instant::now();
    let mut interval = MIN_POLL_INTERVAL;

    while is_spotify_running(ctx) {
        if start.elapsed() >= timeout {
            crate::logging::warn("Timed out waiting for Spotify to exit; starting anyway");
            return;
        }

        thread::sleep(interval);
        interval = (interval * 2).min(MAX_POLL_INTERVAL);
    }
}

fn start_spotify(ctx: &AppContext) -> Result<()> {
    let mut final_args = Vec::new();
    if ctx.mirror {
        final_args.push(format!(
            "--app-directory={}",
            ctx.config_path.join("apps").display()
        ));
    }

    Command::new(&ctx.spotify_exec_path)
        .args(final_args)
        .spawn()
        .context("failed to start Spotify")?;
    Ok(())
}

fn spotify_image_name(ctx: &AppContext) -> String {
    ctx.spotify_exec_path
        .file_name()
        .and_then(OsStr::to_str)
        .map(|name| name.to_string())
        .unwrap_or_else(|| {
            if cfg!(windows) {
                "spotify.exe".to_string()
            } else {
                "spotify".to_string()
            }
        })
}

#[cfg(windows)]
fn is_spotify_running(ctx: &AppContext) -> bool {
    is_running_windows(&spotify_image_name(ctx))
}

#[cfg(not(windows))]
fn is_spotify_running(ctx: &AppContext) -> bool {
    is_running_unix(ctx)
}

#[cfg(windows)]
fn stop_spotify(ctx: &AppContext) -> Result<()> {
    stop_windows(&spotify_image_name(ctx))
}

#[cfg(not(windows))]
fn stop_spotify(ctx: &AppContext) -> Result<()> {
    stop_unix(ctx)
}

#[cfg(windows)]
fn is_running_windows(image: &str) -> bool {
    let output = Command::new("tasklist")
        .args(["/FI", &format!("IMAGENAME eq {image}"), "/FO", "CSV", "/NH"])
        .output();

    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout).to_ascii_lowercase();
            text.contains(&format!("\"{}\"", image.to_ascii_lowercase()))
        }
        _ => false,
    }
}

#[cfg(windows)]
fn stop_windows(image: &str) -> Result<()> {
    let output = Command::new("taskkill")
        .args(["/IM", image, "/T", "/F"])
        .output()
        .with_context(|| format!("failed to invoke taskkill for {image}"))?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).to_ascii_lowercase();
    if stderr.contains("not found") || stderr.contains("no running instance") {
        return Ok(());
    }

    anyhow::bail!(
        "taskkill failed for {image}: {}",
        String::from_utf8_lossy(&output.stderr).trim()
    )
}

#[cfg(not(windows))]
fn is_running_unix(ctx: &AppContext) -> bool {
    let candidates = process_name_candidates(ctx);
    for name in candidates {
        if Command::new("pgrep")
            .args(["-x", &name])
            .status()
            .is_ok_and(|status| status.success())
        {
            return true;
        }
    }
    false
}

#[cfg(not(windows))]
fn stop_unix(ctx: &AppContext) -> Result<()> {
    let candidates = process_name_candidates(ctx);
    for name in candidates {
        let _ = Command::new("pkill").args(["-x", &name]).status();
    }
    Ok(())
}

#[cfg(not(windows))]
fn process_name_candidates(ctx: &AppContext) -> Vec<String> {
    let mut names = Vec::new();
    if let Some(file_name) = ctx.spotify_exec_path.file_name().and_then(OsStr::to_str) {
        if !file_name.is_empty() {
            names.push(file_name.to_string());
            if let Some(stem) = ctx.spotify_exec_path.file_stem().and_then(OsStr::to_str) {
                if !stem.is_empty() {
                    names.push(stem.to_string());
                }
            }
        }
    }
    names.push("Spotify".to_string());
    names.push("spotify".to_string());
    names.sort();
    names.dedup();
    names
}
