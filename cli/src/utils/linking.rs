use std::fs;
use std::path::Path;

use anyhow::Result;

pub fn create_dir_link(src: &Path, dst: &Path) -> Result<()> {
    if let Some(parent) = dst.parent() {
        fs::create_dir_all(parent)?;
    }
    let _ = fs::remove_file(dst);
    let _ = fs::remove_dir_all(dst);

    #[cfg(unix)]
    {
        std::os::unix::fs::symlink(src, dst)?;
        return Ok(());
    }

    #[cfg(windows)]
    {
        match std::os::windows::fs::symlink_dir(src, dst) {
            Ok(()) => return Ok(()),
            Err(_) => {
                junction::create(src, dst)?;
                return Ok(());
            }
        }
    }

    #[allow(unreachable_code)]
    Ok(())
}
