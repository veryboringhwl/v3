use anyhow::Result;

use crate::app::AppContext;
use crate::infrastructure::ports::{ConfigPort, FileSystemPort};

pub fn run_with(ctx: &AppContext, fs: &dyn FileSystemPort, config: &dyn ConfigPort) -> Result<()> {
    if !fs.exists(&ctx.config_file) {
        let existing = config.load_or_default(&ctx.config_file)?;
        config.save(&ctx.config_file, &existing)?;
    }

    for folder in ["hooks", "modules", "store"] {
        let path = ctx.config_path.join(folder);
        let _ = fs.remove_dir_all(&path);
    }

    let paths = crate::module::ModulePaths::from_config(&ctx.config_path);
    crate::module::initialize_vault(&paths)
}
