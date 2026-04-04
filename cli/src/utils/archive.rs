use std::fs::{self, File};
use std::io;
use std::path::Path;

use anyhow::{Context, Result};
use flate2::read::GzDecoder;
use tar::Archive;
use zip::ZipArchive;

pub fn unzip_file(zip_path: &Path, dest: &Path) -> Result<()> {
    let file = File::open(zip_path)?;
    let mut zip = ZipArchive::new(file)?;
    unzip_archive(&mut zip, dest)
}

pub fn unzip_archive<R: io::Read + io::Seek>(zip: &mut ZipArchive<R>, dest: &Path) -> Result<()> {
    fs::create_dir_all(dest)?;
    let dest = dest.to_path_buf();

    for i in 0..zip.len() {
        let mut entry = zip.by_index(i)?;
        let out_path = dest.join(entry.name());
        let out_clean = out_path.components().collect::<std::path::PathBuf>();
        let dest_clean = dest.components().collect::<std::path::PathBuf>();

        if !out_clean.starts_with(&dest_clean) {
            anyhow::bail!("illegal zip path");
        }

        if entry.is_dir() {
            fs::create_dir_all(&out_clean)?;
            continue;
        }

        if let Some(parent) = out_clean.parent() {
            fs::create_dir_all(parent)?;
        }

        let mut out = File::create(&out_clean)
            .with_context(|| format!("failed creating {}", out_clean.display()))?;
        io::copy(&mut entry, &mut out)?;
    }

    Ok(())
}

pub fn untar_gz_reader<R: io::Read>(reader: R, dest: &Path) -> Result<()> {
    fs::create_dir_all(dest)?;
    let gz = GzDecoder::new(reader);
    let mut tar = Archive::new(gz);
    tar.unpack(dest)?;
    Ok(())
}
