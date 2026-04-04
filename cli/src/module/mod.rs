mod metadata;
pub mod vault;

use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{Result, anyhow};

use crate::archive;
use crate::linking;

pub use vault::{Store, StoreIdentifier, Vault};

#[derive(Debug, Clone)]
pub struct ModulePaths {
    pub modules_root: PathBuf,
    pub store_root: PathBuf,
    pub vault_path: PathBuf,
}

impl ModulePaths {
    pub fn from_config(config_path: &Path) -> Self {
        let modules_root = config_path.join("modules");
        let store_root = config_path.join("store");
        let vault_path = modules_root.join("vault.json");
        Self {
            modules_root,
            store_root,
            vault_path,
        }
    }
}

pub fn initialize_vault(paths: &ModulePaths) -> Result<()> {
    let v = Vault::default();
    vault::save(&paths.vault_path, &v)
}

pub fn add_store_in_vault(paths: &ModulePaths, id: &StoreIdentifier, store: Store) -> Result<()> {
    let mut v = vault::load(&paths.vault_path)?;
    let module = v.modules.entry(id.module_identifier.clone()).or_default();
    module.v.insert(id.version.clone(), store);
    vault::save(&paths.vault_path, &v)
}

pub fn install_module(paths: &ModulePaths, id: &StoreIdentifier) -> Result<()> {
    let mut v = vault::load(&paths.vault_path)?;
    let module = v
        .modules
        .get_mut(&id.module_identifier)
        .ok_or_else(|| anyhow!("missing module {}", id.module_identifier))?;
    let store = module
        .v
        .get_mut(&id.version)
        .ok_or_else(|| anyhow!("missing store {}", id.as_string()))?;

    let artifact = store
        .artifacts
        .first()
        .ok_or_else(|| anyhow!("store has no artifacts"))?
        .clone();

    if artifact.starts_with("http://") || artifact.starts_with("https://") {
        let response = reqwest::blocking::get(&artifact)?;
        let bytes = response.bytes()?;
        let dest = id.store_path(&paths.store_root);
        fs::create_dir_all(&dest)?;
        let archive_file = dest.join("artifact.zip");
        fs::write(&archive_file, bytes)?;
        archive::unzip_file(&archive_file, &dest)?;
        let _ = fs::remove_file(archive_file);
    } else {
        let src = PathBuf::from(&artifact);
        let dest = id.store_path(&paths.store_root);
        linking::create_dir_link(&src, &dest)?;
    }

    store.installed = true;
    vault::save(&paths.vault_path, &v)
}

pub fn enable_module_in_vault(paths: &ModulePaths, id: &StoreIdentifier) -> Result<()> {
    let mut v = vault::load(&paths.vault_path)?;
    let module = v
        .modules
        .get_mut(&id.module_identifier)
        .ok_or_else(|| anyhow!("missing module {}", id.module_identifier))?;

    if !id.version.is_empty() && !module.v.contains_key(&id.version) {
        return Err(anyhow!("missing store {}", id.as_string()));
    }

    module.enabled = id.version.clone();
    let link_path = id.module_link_path(&paths.modules_root);
    let _ = fs::remove_file(&link_path);
    let _ = fs::remove_dir_all(&link_path);

    if !module.enabled.is_empty() {
        let store_path = id.store_path(&paths.store_root);
        linking::create_dir_link(&store_path, &link_path)?;
    }

    vault::save(&paths.vault_path, &v)
}

pub fn delete_module(paths: &ModulePaths, id: &StoreIdentifier) -> Result<()> {
    let mut v = vault::load(&paths.vault_path)?;
    if let Some(module) = v.modules.get_mut(&id.module_identifier) {
        if module.enabled == id.version {
            module.enabled.clear();
            let link_path = id.module_link_path(&paths.modules_root);
            let _ = fs::remove_file(link_path);
        }
        if let Some(store) = module.v.get_mut(&id.version) {
            store.installed = false;
        }
    }

    vault::save(&paths.vault_path, &v)?;
    let store_path = id.store_path(&paths.store_root);
    let _ = fs::remove_dir_all(store_path);
    Ok(())
}

pub fn remove_store_in_vault(paths: &ModulePaths, id: &StoreIdentifier) -> Result<()> {
    let mut v = vault::load(&paths.vault_path)?;
    if let Some(module) = v.modules.get_mut(&id.module_identifier) {
        module.v.remove(&id.version);
    }
    vault::save(&paths.vault_path, &v)
}
