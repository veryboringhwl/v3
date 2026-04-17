use anyhow::Result;

use crate::core::app::AppContext;
use crate::infrastructure::ports::{ArchivePort, FileSystemPort, NetworkPort};

pub fn run_with(
    ctx: &AppContext,
    network: &dyn NetworkPort,
    fs: &dyn FileSystemPort,
    archive: &dyn ArchivePort,
) -> Result<()> {
    let bytes = network
        .get_bytes("http://github.com/veryboringhwl/v3/releases/latest/download/hooks.tar.gz")?;

    let hooks = ctx.config_path.join("hooks");
    let _ = fs.remove_dir_all(&hooks);
    archive.untar_gz_bytes(&bytes, &hooks)
}
