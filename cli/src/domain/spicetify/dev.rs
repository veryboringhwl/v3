use anyhow::{Context, Result};

use crate::app::AppContext;
use crate::infrastructure::ports::FileSystemPort;

pub fn run_with(ctx: &AppContext, fs: &dyn FileSystemPort) -> Result<()> {
    let offline_bnk = ctx.spotify_config_path.join("offline.bnk");

    let mut data = fs.read_bytes(&offline_bnk).with_context(|| {
        format!(
            "failed to open {} (spotify-config-path: {})",
            offline_bnk.display(),
            ctx.spotify_config_path.display()
        )
    })?;

    if let Some(pos) = find_bytes(&data, b"app-developer") {
        let idx = pos + 14;
        if idx < data.len() {
            data[idx] = b'2';
        }
    }

    if let Some(pos) = rfind_bytes(&data, b"app-developer") {
        let idx = pos + 15;
        if idx < data.len() {
            data[idx] = b'2';
        }
    }

    fs.write_bytes(&offline_bnk, &data)?;

    Ok(())
}

fn find_bytes(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack.windows(needle.len()).position(|w| w == needle)
}

fn rfind_bytes(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack.windows(needle.len()).rposition(|w| w == needle)
}

