use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{Result, anyhow};
use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Store {
    pub installed: bool,
    pub artifacts: Vec<String>,
    #[serde(default)]
    pub checksum: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Module {
    pub enabled: String,
    pub v: BTreeMap<String, Store>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Vault {
    pub modules: BTreeMap<String, Module>,
}

#[derive(Debug, Clone)]
pub struct StoreIdentifier {
    pub module_identifier: String,
    pub version: String,
}

impl StoreIdentifier {
    pub fn parse(raw: &str) -> Result<Self> {
        let re = Regex::new(r"^([^@]+)@([^@]+)$")?;
        let cap = re
            .captures(raw)
            .ok_or_else(|| anyhow!("invalid store id, expected module@version"))?;

        Ok(Self {
            module_identifier: cap.get(1).map(|m| m.as_str()).unwrap_or_default().to_string(),
            version: cap.get(2).map(|m| m.as_str()).unwrap_or_default().to_string(),
        })
    }

    pub fn as_string(&self) -> String {
        format!("{}@{}", self.module_identifier, self.version)
    }

    pub fn store_path(&self, store_root: &Path) -> PathBuf {
        store_root.join(&self.module_identifier).join(&self.version)
    }

    pub fn module_link_path(&self, modules_root: &Path) -> PathBuf {
        modules_root.join(&self.module_identifier)
    }
}

pub fn load(path: &Path) -> Result<Vault> {
    if !path.exists() {
        return Ok(Vault::default());
    }
    let raw = fs::read_to_string(path)?;
    Ok(serde_json::from_str(&raw)?)
}

pub fn save(path: &Path, vault: &Vault) -> Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let raw = serde_json::to_string(vault)?;
    fs::write(path, raw)?;
    Ok(())
}
