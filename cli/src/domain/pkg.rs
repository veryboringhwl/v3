use anyhow::Result;

use crate::core::app::AppContext;
use crate::infrastructure::ports::FileSystemPort;
use crate::module;

pub fn install_with(ctx: &AppContext, id: &str, url: &str, fs: &dyn FileSystemPort) -> Result<()> {
    let id = module::vault::StoreIdentifier::parse(id)?;
    let paths = module::ModulePaths::from_config(&ctx.config_path);

    module::add_store_in_vault(
        &paths,
        &id,
        module::Store {
            installed: false,
            artifacts: vec![normalize_artifact_url(url, fs)?],
            checksum: String::new(),
        },
    )?;

    module::install_module(&paths, &id)
}

pub fn delete_with(ctx: &AppContext, id: &str) -> Result<()> {
    let id = module::vault::StoreIdentifier::parse(id)?;
    let paths = module::ModulePaths::from_config(&ctx.config_path);
    module::delete_module(&paths, &id)?;
    module::remove_store_in_vault(&paths, &id)
}

pub fn enable_with(ctx: &AppContext, id: &str) -> Result<()> {
    let id = module::vault::StoreIdentifier::parse(id)?;
    let paths = module::ModulePaths::from_config(&ctx.config_path);
    module::enable_module_in_vault(&paths, &id)
}

fn normalize_artifact_url(raw: &str, fs: &dyn FileSystemPort) -> Result<String> {
    if raw.starts_with("http://") || raw.starts_with("https://") {
        return Ok(raw.to_string());
    }
    let path = std::path::PathBuf::from(raw);
    if path.is_absolute() {
        return Ok(path.to_string_lossy().to_string());
    }

    let abs = fs.current_dir()?.join(path);
    Ok(abs.to_string_lossy().to_string())
}
