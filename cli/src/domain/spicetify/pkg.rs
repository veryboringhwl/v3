use anyhow::Result;

use crate::app::AppContext;
use crate::infrastructure::ports::FileSystemPort;

pub fn install_with(ctx: &AppContext, id: &str, url: &str, fs: &dyn FileSystemPort) -> Result<()> {
    let id = crate::module::vault::StoreIdentifier::parse(id)?;
    let paths = crate::module::ModulePaths::from_config(&ctx.config_path);

    crate::module::add_store_in_vault(
        &paths,
        &id,
        crate::module::Store {
            installed: false,
            artifacts: vec![normalize_artifact_url(url, fs)?],
            checksum: String::new(),
        },
    )?;

    crate::module::install_module(&paths, &id)
}

pub fn delete_with(ctx: &AppContext, id: &str) -> Result<()> {
    let id = crate::module::vault::StoreIdentifier::parse(id)?;
    let paths = crate::module::ModulePaths::from_config(&ctx.config_path);
    crate::module::delete_module(&paths, &id)?;
    crate::module::remove_store_in_vault(&paths, &id)
}

pub fn enable_with(ctx: &AppContext, id: &str) -> Result<()> {
    let id = crate::module::vault::StoreIdentifier::parse(id)?;
    let paths = crate::module::ModulePaths::from_config(&ctx.config_path);
    crate::module::enable_module_in_vault(&paths, &id)
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
