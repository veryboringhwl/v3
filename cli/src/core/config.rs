use std::fs;
use std::path::{Path, PathBuf};

use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    #[serde(default = "default_daemon")]
    pub daemon: bool,
    #[serde(default)]
    pub mirror: bool,
    #[serde(default)]
    pub spotify_data_path: Option<PathBuf>,
    #[serde(default)]
    pub spotify_exec_path: Option<PathBuf>,
    #[serde(default)]
    pub spotify_config_path: Option<PathBuf>,
}

fn default_daemon() -> bool {
    true
}

impl Default for Config {
    fn default() -> Self {
        Self {
            daemon: true,
            mirror: false,
            spotify_data_path: None,
            spotify_exec_path: None,
            spotify_config_path: None,
        }
    }
}

pub fn load_or_default(path: &Path) -> Result<Config> {
    if !path.exists() {
        return Ok(Config::default());
    }
    let raw = fs::read_to_string(path)?;
    let cfg = serde_yml::from_str::<Config>(&raw)?;
    Ok(cfg)
}

pub fn save(path: &Path, cfg: &Config) -> Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let raw = serde_yml::to_string(cfg)?;
    fs::write(path, raw)?;
    Ok(())
}
