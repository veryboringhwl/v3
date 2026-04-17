use std::path::Path;
use std::process::Command;

use anyhow::{Context, Result};

use crate::core::app::AppContext;
use crate::core::config::{self, Config};
use crate::infrastructure::daemon_runtime;
use crate::infrastructure::ports::{
    ApplicationPorts, ArchivePort, ConfigPort, DaemonPort, FileSystemPort, LinkingPort,
    LoggingPort, NetworkPort, ProcessPort, SpotifyProcessPort, UriLauncherPort,
};
use crate::process::spotify;
use crate::utils::{archive, linking, logging};

pub struct SystemLogger;

impl LoggingPort for SystemLogger {
    fn info(&self, message: &str) {
        logging::info(message);
    }

    fn warn(&self, message: &str) {
        logging::warn(message);
    }

    fn error(&self, message: &str) {
        logging::error(message);
    }

    fn fatal(&self, message: &str) {
        logging::fatal(message);
    }
}

pub struct SystemSpotifyProcess;

impl SpotifyProcessPort for SystemSpotifyProcess {
    fn start(&self, ctx: &AppContext) -> Result<()> {
        spotify::start(ctx)
    }

    fn stop(&self, ctx: &AppContext) -> Result<()> {
        spotify::stop(ctx)
    }

    fn restart(&self, ctx: &AppContext) -> Result<()> {
        spotify::restart(ctx)
    }

    fn restart_if_running(&self, ctx: &AppContext) -> Result<()> {
        spotify::restart_if_running(ctx)
    }
}

pub struct SystemFileSystem;

impl FileSystemPort for SystemFileSystem {
    fn create_dir_all(&self, path: &Path) -> std::io::Result<()> {
        std::fs::create_dir_all(path)
    }

    fn remove_dir_all(&self, path: &Path) -> std::io::Result<()> {
        std::fs::remove_dir_all(path)
    }

    fn remove_file(&self, path: &Path) -> std::io::Result<()> {
        std::fs::remove_file(path)
    }

    fn rename(&self, from: &Path, to: &Path) -> std::io::Result<()> {
        std::fs::rename(from, to)
    }

    fn read_bytes(&self, path: &Path) -> std::io::Result<Vec<u8>> {
        std::fs::read(path)
    }

    fn write_bytes(&self, path: &Path, data: &[u8]) -> std::io::Result<()> {
        std::fs::write(path, data)
    }

    fn read_to_string(&self, path: &Path) -> std::io::Result<String> {
        std::fs::read_to_string(path)
    }

    fn write_string(&self, path: &Path, data: &str) -> std::io::Result<()> {
        std::fs::write(path, data)
    }

    fn read_dir_paths(&self, path: &Path) -> std::io::Result<Vec<std::path::PathBuf>> {
        let mut paths = Vec::new();
        for entry in std::fs::read_dir(path)? {
            paths.push(entry?.path());
        }
        Ok(paths)
    }

    fn exists(&self, path: &Path) -> bool {
        path.exists()
    }

    fn current_dir(&self) -> std::io::Result<std::path::PathBuf> {
        std::env::current_dir()
    }
}

pub struct SystemNetwork;

impl NetworkPort for SystemNetwork {
    fn get_bytes(&self, url: &str) -> Result<Vec<u8>> {
        let response = reqwest::blocking::get(url).with_context(|| format!("GET {url}"))?;
        Ok(response.bytes()?.to_vec())
    }
}

pub struct SystemProcess;

impl ProcessPort for SystemProcess {
    fn spawn_program(&self, program: &Path, args: &[String]) -> Result<()> {
        Command::new(program)
            .args(args)
            .spawn()
            .with_context(|| format!("failed to spawn {}", program.display()))?;
        Ok(())
    }
}

pub struct SystemArchive;

impl ArchivePort for SystemArchive {
    fn unzip_file(&self, zip_path: &Path, dest: &Path) -> Result<()> {
        archive::unzip_file(zip_path, dest)
    }

    fn untar_gz_bytes(&self, bytes: &[u8], dest: &Path) -> Result<()> {
        archive::untar_gz_reader(std::io::Cursor::new(bytes), dest)
    }
}

pub struct SystemLinking;

impl LinkingPort for SystemLinking {
    fn create_dir_link(&self, src: &Path, dst: &Path) -> Result<()> {
        linking::create_dir_link(src, dst)
    }
}

pub struct SystemConfig;

impl ConfigPort for SystemConfig {
    fn load_or_default(&self, path: &Path) -> Result<Config> {
        config::load_or_default(path)
    }

    fn save(&self, path: &Path, cfg: &Config) -> Result<()> {
        config::save(path, cfg)
    }
}

pub struct SystemUriLauncher;

impl UriLauncherPort for SystemUriLauncher {
    fn open_uri(&self, uri: &str) -> Result<()> {
        open_uri_system(uri)
    }
}

#[cfg(target_os = "windows")]
fn open_uri_system(uri: &str) -> Result<()> {
    Command::new("cmd")
        .args(["/c", "start", uri])
        .spawn()
        .with_context(|| format!("failed to open URI {uri}"))?;
    Ok(())
}

#[cfg(target_os = "macos")]
fn open_uri_system(uri: &str) -> Result<()> {
    Command::new("open")
        .arg(uri)
        .spawn()
        .with_context(|| format!("failed to open URI {uri}"))?;
    Ok(())
}

#[cfg(all(unix, not(target_os = "macos")))]
fn open_uri_system(uri: &str) -> Result<()> {
    Command::new("xdg-open")
        .arg(uri)
        .spawn()
        .with_context(|| format!("failed to open URI {uri}"))?;
    Ok(())
}

pub struct SystemDaemon;

impl DaemonPort for SystemDaemon {
    fn start(&self, ctx: &AppContext) -> Result<()> {
        daemon_runtime::start(ctx)
    }
}

pub struct SystemPorts {
    logger: SystemLogger,
    spotify_process: SystemSpotifyProcess,
    fs: SystemFileSystem,
    network: SystemNetwork,
    process: SystemProcess,
    archive: SystemArchive,
    linking: SystemLinking,
    config: SystemConfig,
    uri_launcher: SystemUriLauncher,
    daemon: SystemDaemon,
}

impl Default for SystemPorts {
    fn default() -> Self {
        Self {
            logger: SystemLogger,
            spotify_process: SystemSpotifyProcess,
            fs: SystemFileSystem,
            network: SystemNetwork,
            process: SystemProcess,
            archive: SystemArchive,
            linking: SystemLinking,
            config: SystemConfig,
            uri_launcher: SystemUriLauncher,
            daemon: SystemDaemon,
        }
    }
}

impl ApplicationPorts for SystemPorts {
    fn logger(&self) -> &dyn LoggingPort {
        &self.logger
    }

    fn spotify_process(&self) -> &dyn SpotifyProcessPort {
        &self.spotify_process
    }

    fn fs(&self) -> &dyn FileSystemPort {
        &self.fs
    }

    fn network(&self) -> &dyn NetworkPort {
        &self.network
    }

    fn process(&self) -> &dyn ProcessPort {
        &self.process
    }

    fn archive(&self) -> &dyn ArchivePort {
        &self.archive
    }

    fn linking(&self) -> &dyn LinkingPort {
        &self.linking
    }

    fn config(&self) -> &dyn ConfigPort {
        &self.config
    }

    fn uri_launcher(&self) -> &dyn UriLauncherPort {
        &self.uri_launcher
    }

    fn daemon(&self) -> &dyn DaemonPort {
        &self.daemon
    }
}
