use anyhow::Result;

use crate::core::app::AppContext;
use crate::infrastructure::ports::{ConfigPort, DaemonPort};

pub fn start_with(ctx: &AppContext, daemon: &dyn DaemonPort) -> Result<()> {
    daemon.start(ctx)
}

pub fn enable_with(ctx: &AppContext, config: &dyn ConfigPort) -> Result<()> {
    let mut cfg = config.load_or_default(&ctx.config_file)?;
    cfg.daemon = true;
    config.save(&ctx.config_file, &cfg)
}

pub fn disable_with(ctx: &AppContext, config: &dyn ConfigPort) -> Result<()> {
    let mut cfg = config.load_or_default(&ctx.config_file)?;
    cfg.daemon = false;
    config.save(&ctx.config_file, &cfg)
}
