#[path = "core/app.rs"]
mod app;
mod application;
#[path = "utils/archive.rs"]
mod archive;
#[path = "core/cli.rs"]
mod cli;
#[path = "core/config.rs"]
mod config;
mod domain;
mod infrastructure;
#[path = "utils/linking.rs"]
mod linking;
#[path = "utils/logging.rs"]
mod logging;
mod module;
#[path = "utils/patch.rs"]
mod patch;
mod paths;
mod process;
mod ui;
#[path = "utils/utf16.rs"]
mod utf16;

use anyhow::Result;
pub fn run(force_spotify_mode: Option<bool>) -> Result<()> {
    application::runtime::run(force_spotify_mode)
}
