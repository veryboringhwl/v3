use std::io::ErrorKind;

use anyhow::{Result, bail};

use crate::app::AppContext;
use crate::infrastructure::ports::{FileSystemPort, LoggingPort};

pub fn run_with(ctx: &AppContext, fs: &dyn FileSystemPort, logger: &dyn LoggingPort) -> Result<()> {
    if ctx.mirror {
        let mirror_apps = ctx.config_path.join("apps");
        if let Err(err) = fs.remove_dir_all(&mirror_apps) {
            logger.warn(&format!(
                "failed to remove mirrored apps folder {}: {}",
                mirror_apps.display(),
                err
            ));
        }
        return Ok(());
    }

    let apps = crate::paths::spotify_apps_path(&ctx.spotify_data_path);
    let mut found = 0usize;

    for p in fs.read_dir_paths(&apps)? {
        let name = p.file_name().and_then(|s| s.to_str()).unwrap_or_default();
        if !name.ends_with(".spa.backup") {
            continue;
        }
        found += 1;
        let spa = restore_target_from_backup(&p);
        let unpacked = unpacked_folder_for_spa(&spa);
        if let Err(err) = fs.remove_dir_all(&unpacked) {
            if err.kind() != ErrorKind::NotFound {
                logger.warn(&format!(
                    "failed to remove unpacked folder {}: {}",
                    unpacked.display(),
                    err
                ));
            }
        }
        if let Err(err) = fs.rename(&p, &spa) {
            logger.error(&format!("failed to restore {}: {}", p.display(), err));
        }
    }

    if found == 0 {
        bail!("Spotify is already in stock state!");
    }

    Ok(())
}

fn restore_target_from_backup(backup: &std::path::Path) -> std::path::PathBuf {
    let s = backup.to_string_lossy();
    if let Some(stripped) = s.strip_suffix(".backup") {
        return std::path::PathBuf::from(stripped);
    }
    backup.to_path_buf()
}

fn unpacked_folder_for_spa(spa: &std::path::Path) -> std::path::PathBuf {
    let s = spa.to_string_lossy();
    if let Some(stripped) = s.strip_suffix(".spa") {
        return std::path::PathBuf::from(stripped);
    }
    spa.to_path_buf()
}
