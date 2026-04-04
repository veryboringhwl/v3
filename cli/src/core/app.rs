use std::path::PathBuf;

use anyhow::Result;

use crate::cli::GlobalArgs;

#[derive(Debug, Clone)]
pub struct AppContext {
    pub config_file: PathBuf,
    pub config_path: PathBuf,
    pub daemon: bool,
    pub mirror: bool,
    pub spotify_data_path: PathBuf,
    pub spotify_exec_path: PathBuf,
    pub spotify_config_path: PathBuf,
}

impl AppContext {
    pub fn from_cli(args: &GlobalArgs) -> Result<Self> {
        let default_config_path = crate::paths::default_spicetify_config_path();
        let config_file = args
            .config
            .as_ref()
            .map(PathBuf::from)
            .unwrap_or_else(|| default_config_path.join("config.yaml"));

        let mut cfg = crate::config::load_or_default(&config_file)?;
        cfg.mirror = cfg.mirror || args.mirror;

        if let Some(v) = &args.spotify_data_path {
            cfg.spotify_data_path = Some(PathBuf::from(v));
        }
        if let Some(v) = &args.spotify_exec_path {
            cfg.spotify_exec_path = Some(PathBuf::from(v));
        }
        if let Some(v) = &args.spotify_config_path {
            cfg.spotify_config_path = Some(PathBuf::from(v));
        }

        let spotify_data_path = cfg
            .spotify_data_path
            .clone()
            .unwrap_or_else(crate::paths::default_spotify_data_path);
        let spotify_exec_path = cfg
            .spotify_exec_path
            .clone()
            .unwrap_or_else(|| crate::paths::default_spotify_exec_path(&spotify_data_path));
        let spotify_config_path = cfg
            .spotify_config_path
            .clone()
            .unwrap_or_else(crate::paths::default_spotify_config_path);

        Ok(Self {
            config_file,
            config_path: default_config_path,
            daemon: cfg.daemon,
            mirror: cfg.mirror,
            spotify_data_path,
            spotify_exec_path,
            spotify_config_path,
        })
    }
}
