use anyhow::Result;

use crate::core::app::AppContext;
use crate::infrastructure::ports::{ConfigPort, FileSystemPort};
use crate::module;

pub fn run_with(ctx: &AppContext, fs: &dyn FileSystemPort, config: &dyn ConfigPort) -> Result<()> {
    if !fs.exists(&ctx.config_file) {
        let existing = config.load_or_default(&ctx.config_file)?;
        config.save(&ctx.config_file, &existing)?;
    }

    for folder in ["hooks", "modules", "store"] {
        let path = ctx.config_path.join(folder);
        let _ = fs.remove_dir_all(&path);
    }

    let paths = module::ModulePaths::from_config(&ctx.config_path);
    module::initialize_vault(&paths)
}
