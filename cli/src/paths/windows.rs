use std::path::{Path, PathBuf};

use directories::BaseDirs;

pub fn spotify_data_path() -> PathBuf {
    if let Ok(appdata) = std::env::var("APPDATA")
        && !appdata.is_empty()
    {
        return PathBuf::from(appdata).join("Spotify");
    }

    BaseDirs::new()
        .map(|b| b.data_dir().join("Spotify"))
        .unwrap_or_else(|| PathBuf::from("."))
}

pub fn spotify_exec_path(data: &Path) -> PathBuf {
    data.join("spotify.exe")
}

pub fn spotify_config_path() -> PathBuf {
    let mut candidates: Vec<PathBuf> = Vec::new();

    if let Ok(localappdata) = std::env::var("LOCALAPPDATA")
        && !localappdata.is_empty()
    {
        candidates.push(PathBuf::from(&localappdata).join("Spotify"));

        let packages = PathBuf::from(&localappdata).join("Packages");
        if let Ok(entries) = std::fs::read_dir(packages) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with("SpotifyAB.SpotifyMusic") {
                    candidates.push(entry.path().join("LocalState").join("Spotify"));
                }
            }
        }
    }

    if let Ok(appdata) = std::env::var("APPDATA")
        && !appdata.is_empty()
    {
        candidates.push(PathBuf::from(appdata).join("Spotify"));
    }

    for c in candidates {
        if c.join("offline.bnk").exists() {
            return c;
        }
    }

    BaseDirs::new()
        .map(|b| b.config_dir().join("Spotify"))
        .unwrap_or_else(|| PathBuf::from("."))
}

pub fn spicetify_config_path() -> PathBuf {
    if let Ok(localappdata) = std::env::var("LOCALAPPDATA")
        && !localappdata.is_empty()
    {
        return PathBuf::from(localappdata).join("Spicetify");
    }

    BaseDirs::new()
        .map(|b| b.data_local_dir().join("Spicetify"))
        .unwrap_or_else(|| PathBuf::from("."))
}
