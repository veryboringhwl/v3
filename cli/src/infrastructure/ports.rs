use std::path::{Path, PathBuf};

use anyhow::Result;

use crate::core::app::AppContext;
use crate::core::config::Config;

#[allow(dead_code)]
pub trait LoggingPort: Send + Sync {
    fn info(&self, message: &str);
    fn warn(&self, message: &str);
    fn error(&self, message: &str);
    fn fatal(&self, message: &str);
}

#[allow(dead_code)]
pub trait SpotifyProcessPort: Send + Sync {
    fn start(&self, ctx: &AppContext) -> Result<()>;
    fn stop(&self, ctx: &AppContext) -> Result<()>;
    fn restart(&self, ctx: &AppContext) -> Result<()>;
    fn restart_if_running(&self, ctx: &AppContext) -> Result<()>;
}

pub trait FileSystemPort: Send + Sync {
    fn create_dir_all(&self, path: &Path) -> std::io::Result<()>;
    fn remove_dir_all(&self, path: &Path) -> std::io::Result<()>;
    fn remove_file(&self, path: &Path) -> std::io::Result<()>;
    fn rename(&self, from: &Path, to: &Path) -> std::io::Result<()>;
    fn read_bytes(&self, path: &Path) -> std::io::Result<Vec<u8>>;
    fn write_bytes(&self, path: &Path, data: &[u8]) -> std::io::Result<()>;
    fn read_to_string(&self, path: &Path) -> std::io::Result<String>;
    fn write_string(&self, path: &Path, data: &str) -> std::io::Result<()>;
    fn read_dir_paths(&self, path: &Path) -> std::io::Result<Vec<PathBuf>>;
    fn exists(&self, path: &Path) -> bool;
    fn current_dir(&self) -> std::io::Result<PathBuf>;
}

pub trait NetworkPort: Send + Sync {
    fn get_bytes(&self, url: &str) -> Result<Vec<u8>>;
}

pub trait ProcessPort: Send + Sync {
    fn spawn_program(&self, program: &Path, args: &[String]) -> Result<()>;
}

pub trait ArchivePort: Send + Sync {
    fn unzip_file(&self, zip_path: &Path, dest: &Path) -> Result<()>;
    fn untar_gz_bytes(&self, bytes: &[u8], dest: &Path) -> Result<()>;
}

pub trait LinkingPort: Send + Sync {
    fn create_dir_link(&self, src: &Path, dst: &Path) -> Result<()>;
}

pub trait ConfigPort: Send + Sync {
    fn load_or_default(&self, path: &Path) -> Result<Config>;
    fn save(&self, path: &Path, cfg: &Config) -> Result<()>;
}

pub trait UriLauncherPort: Send + Sync {
    fn open_uri(&self, uri: &str) -> Result<()>;
}

pub trait DaemonPort: Send + Sync {
    fn start(&self, ctx: &AppContext) -> Result<()>;
}

pub trait ApplicationPorts: Send + Sync {
    fn logger(&self) -> &dyn LoggingPort;
    fn spotify_process(&self) -> &dyn SpotifyProcessPort;
    fn fs(&self) -> &dyn FileSystemPort;
    fn network(&self) -> &dyn NetworkPort;
    fn process(&self) -> &dyn ProcessPort;
    fn archive(&self) -> &dyn ArchivePort;
    fn linking(&self) -> &dyn LinkingPort;
    fn config(&self) -> &dyn ConfigPort;
    fn uri_launcher(&self) -> &dyn UriLauncherPort;
    fn daemon(&self) -> &dyn DaemonPort;
}
