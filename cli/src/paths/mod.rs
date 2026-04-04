use std::env;
use std::path::{Path, PathBuf};

pub fn default_spicetify_config_path() -> PathBuf {
    if let Ok(exe) = env::current_exe() {
        if let Ok(real) = dunce::canonicalize(exe) {
            let bin = real.parent().map(Path::to_path_buf).unwrap_or_default();
            let app = bin.parent().map(Path::to_path_buf).unwrap_or_default();
            let bin_name = bin.file_name().and_then(|s| s.to_str()).unwrap_or_default();
            let app_name = app
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or_default()
                .to_lowercase();
            if bin_name.eq_ignore_ascii_case("bin") && app_name.starts_with("spicetify") {
                let portable = app.join("config");
                if portable.exists() {
                    return portable;
                }
            }
        }
    }

    platform_spicetify_config_path()
}

pub fn spotify_apps_path(spotify_data: &Path) -> PathBuf {
    spotify_data.join("Apps")
}

#[cfg(target_os = "windows")]
fn platform_spicetify_config_path() -> PathBuf {
    windows::spicetify_config_path()
}

#[cfg(target_os = "windows")]
pub fn default_spotify_data_path() -> PathBuf {
    windows::spotify_data_path()
}

#[cfg(target_os = "windows")]
pub fn default_spotify_exec_path(data: &Path) -> PathBuf {
    windows::spotify_exec_path(data)
}

#[cfg(target_os = "windows")]
pub fn default_spotify_config_path() -> PathBuf {
    windows::spotify_config_path()
}

#[cfg(target_os = "linux")]
fn platform_spicetify_config_path() -> PathBuf {
    linux::spicetify_config_path()
}

#[cfg(target_os = "linux")]
pub fn default_spotify_data_path() -> PathBuf {
    linux::spotify_data_path()
}

#[cfg(target_os = "linux")]
pub fn default_spotify_exec_path(data: &Path) -> PathBuf {
    linux::spotify_exec_path(data)
}

#[cfg(target_os = "linux")]
pub fn default_spotify_config_path() -> PathBuf {
    linux::spotify_config_path()
}

#[cfg(target_os = "macos")]
fn platform_spicetify_config_path() -> PathBuf {
    macos::spicetify_config_path()
}

#[cfg(target_os = "macos")]
pub fn default_spotify_data_path() -> PathBuf {
    macos::spotify_data_path()
}

#[cfg(target_os = "macos")]
pub fn default_spotify_exec_path(data: &Path) -> PathBuf {
    macos::spotify_exec_path(data)
}

#[cfg(target_os = "macos")]
pub fn default_spotify_config_path() -> PathBuf {
    macos::spotify_config_path()
}

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "macos")]
mod macos;
