use std::path::{Path, PathBuf};

use anyhow::{Context, Result, anyhow};

use crate::core::app::AppContext;
use crate::infrastructure::ports::{ArchivePort, FileSystemPort, LinkingPort, LoggingPort};
use crate::paths;
use crate::utils::patch;
use crate::utils::utf16;

pub fn run_with(
    ctx: &AppContext,
    fs: &dyn FileSystemPort,
    archive: &dyn ArchivePort,
    linking: &dyn LinkingPort,
    logger: &dyn LoggingPort,
) -> Result<()> {
    let src_apps = paths::spotify_apps_path(&ctx.spotify_data_path);
    let dest_apps = if ctx.mirror {
        ctx.config_path.join("apps")
    } else {
        src_apps.clone()
    };

    fs.create_dir_all(&dest_apps)?;

    let spa = src_apps.join("xpui.spa");
    if is_already_applied(&spa, &dest_apps, fs) {
        return Err(anyhow!("Spicetify appears to be already applied."));
    }

    logger.info(&format!(
        "Extracting {} -> {}",
        spa.display(),
        dest_apps.join("xpui").display()
    ));
    extract_spa(&spa, &dest_apps, ctx.mirror, fs, archive)?;

    let dest_xpui = dest_apps.join("xpui");
    logger.info("Extracting xpui-modules from V8 snapshot binary...");
    if let Err(err) = create_modules_file(&ctx.spotify_data_path, &dest_xpui, fs) {
        logger.error(&format!("Failed to extract modules: {err}"));
        return Err(err);
    }

    logger.info("Patching xpui/index.html to redirect to modules");
    patch_index(&dest_xpui, fs)?;

    link_runtime_dirs(&ctx.config_path, &dest_xpui, fs, linking, logger)?;
    Ok(())
}

fn is_already_applied(spa: &Path, dest_folder: &Path, fs: &dyn FileSystemPort) -> bool {
    !fs.exists(spa) && fs.exists(&dest_folder.join("xpui"))
}

fn extract_spa(
    spa: &Path,
    dest_folder: &Path,
    mirror: bool,
    fs: &dyn FileSystemPort,
    archive: &dyn ArchivePort,
) -> Result<()> {
    if !fs.exists(spa) {
        let already_applied_dir = dest_folder.join("xpui");
        if fs.exists(&already_applied_dir) {
            return Err(anyhow!("Spicetify appears to be already applied.",));
        }
        return Err(anyhow!(
            "could not find Spotify's xpui.spa at {}. Set --spotify-data-path (or spotify-data-path in config.yaml) to your Spotify install folder; for Microsoft Store installs also enable mirror mode",
            spa.display()
        ));
    }

    let base = spa
        .file_name()
        .and_then(|s| s.to_str())
        .ok_or_else(|| anyhow!("invalid spa filename"))?;
    let name = base.trim_end_matches(".spa");
    let extract_dest = dest_folder.join(name);

    archive.unzip_file(spa, &extract_dest)?;

    if !mirror {
        let backup = spa.with_extension("spa.backup");
        if fs.exists(&backup) {
            let _ = fs.remove_file(&backup);
        }
        fs.rename(spa, &backup)?;
    }

    Ok(())
}

fn create_modules_file(
    spotify_base_path: &Path,
    dest_xpui_path: &Path,
    fs: &dyn FileSystemPort,
) -> Result<()> {
    let mut snapshot_path: Option<PathBuf> = None;
    for entry in fs.read_dir_paths(spotify_base_path)? {
        let name = entry
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or_default()
            .to_string();
        if name.starts_with("v8_context_snapshot") && name.ends_with(".bin") {
            snapshot_path = Some(entry);
            break;
        }
    }

    let snapshot = snapshot_path.ok_or_else(|| anyhow!("v8_context_snapshot*.bin not found"))?;
    let data = fs.read_bytes(&snapshot)?;
    let js =
        utf16::extract_between_markers(&data, "var __webpack_modules__={", "xpui-modules.js.map")?;
    fs.write_string(&dest_xpui_path.join("xpui-modules.js"), &js)?;
    Ok(())
}

fn patch_index(dest_xpui_path: &Path, fs: &dyn FileSystemPort) -> Result<()> {
    let index_path = dest_xpui_path.join("index.html");
    let raw = fs
        .read_to_string(&index_path)
        .context("failed reading xpui/index.html")?;
    let patched = patch::patch_index_html(&raw)?;
    fs.write_string(&index_path, &patched)?;
    Ok(())
}

fn link_runtime_dirs(
    config_path: &Path,
    dest_xpui_path: &Path,
    fs: &dyn FileSystemPort,
    linking: &dyn LinkingPort,
    logger: &dyn LoggingPort,
) -> Result<()> {
    for folder in ["hooks", "modules", "store"] {
        let src = config_path.join(folder);
        let dst = dest_xpui_path.join(folder);
        logger.info(&format!("Linking {} -> {}", dst.display(), src.display()));
        if !fs.exists(&src) {
            fs.create_dir_all(&src)?;
        }
        linking.create_dir_link(&src, &dst)?;
    }
    Ok(())
}
