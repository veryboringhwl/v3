use anyhow::Result;
use clap::Parser;

use crate::application::dispatcher;
use crate::core::app::AppContext;
use crate::core::cli::{SpicetifyCli, SpotifyCli};
use crate::ui::tui;

pub fn run(force_spotify_mode: Option<bool>) -> Result<()> {
    let spotify_mode = match force_spotify_mode {
        Some(v) => v,
        None => {
            let exe = std::env::args_os()
                .next()
                .and_then(|s| {
                    std::path::PathBuf::from(s)
                        .file_name()
                        .map(|s| s.to_os_string())
                })
                .and_then(|s| s.to_str().map(|s| s.to_lowercase()))
                .unwrap_or_else(|| String::from("spicetify"));
            exe.starts_with("spotify")
        }
    };

    if spotify_mode {
        let cli = SpotifyCli::parse();
        let ctx = AppContext::from_cli(&cli.global)?;
        return dispatcher::dispatch_spotify(cli.command, &ctx);
    }

    let cli = SpicetifyCli::parse();
    let ctx = AppContext::from_cli(&cli.global)?;
    match cli.command {
        Some(command) => dispatcher::dispatch_spicetify(command, &ctx),
        None => tui::run(&ctx),
    }
}
