mod application;
mod core;
mod domain;
mod infrastructure;
mod module;
mod paths;
mod process;
mod ui;
mod utils;

use anyhow::Result;

fn run(force_spotify_mode: Option<bool>) -> Result<()> {
    application::runtime::run(force_spotify_mode)
}

fn main() {
    if let Err(err) = run(None) {
        eprintln!("\x1b[31;1mFATAL\x1b[0m {err}");
        std::process::exit(1);
    }
}
