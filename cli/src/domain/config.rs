use anyhow::Result;

use crate::core::app::AppContext;
use crate::infrastructure::ports::LoggingPort;

pub fn run_with(ctx: &AppContext, logger: &dyn LoggingPort) -> Result<()> {
    logger.info(&format!("config file path: {}", ctx.config_path.display()));
    logger.info(&format!("daemon: {}", ctx.daemon));
    logger.info(&format!("mirror: {}", ctx.mirror));
    logger.info(&format!(
        "Spotify data path: {}",
        ctx.spotify_data_path.display()
    ));
    logger.info(&format!(
        "Spotify exec path: {}",
        ctx.spotify_exec_path.display()
    ));
    logger.info(&format!(
        "Spotify config path: {}",
        ctx.spotify_config_path.display()
    ));
    Ok(())
}
