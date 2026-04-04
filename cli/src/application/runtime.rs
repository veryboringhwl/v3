use anyhow::Result;
use clap::Parser;

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
        let cli = crate::cli::SpotifyCli::parse();
        let ctx = crate::app::AppContext::from_cli(&cli.global)?;
        return crate::application::dispatcher::dispatch_spotify(cli.command, &ctx);
    }

    let cli = crate::cli::SpicetifyCli::parse();
    let ctx = crate::app::AppContext::from_cli(&cli.global)?;
    match cli.command {
        Some(command) => crate::application::dispatcher::dispatch_spicetify(command, &ctx),
        None => crate::ui::tui::run(&ctx),
    }
}
