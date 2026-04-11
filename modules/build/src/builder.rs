use std::{
    fs, path::{Path, PathBuf}, time::{SystemTime, UNIX_EPOCH}
};

use anyhow::{Context, Result};
use serde::Deserialize;
use walkdir::WalkDir;

use crate::{
    transpile::Transpiler, util::{ensure_parent, normalize_slashes}
};

#[derive(Clone, Debug, Deserialize)]
pub struct MetadataEntries {
    pub js: Option<String>,
    pub css: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct Metadata {
    pub name: Option<String>,
    #[allow(dead_code)]
    pub version: Option<String>,
    pub entries: MetadataEntries,
}

pub struct BuilderOpts {
    pub metadata: Metadata,
    pub identifier: String,
    pub input_dir: PathBuf,
    pub output_dir: PathBuf,
}

#[derive(Default, Clone, Copy)]
pub struct BuildOpts {
    pub js: bool,
    pub css: bool,
    pub unknown: bool,
}

pub struct Builder {
    scripts_input: Option<Vec<PathBuf>>,
    scss_input: Option<PathBuf>,
    pub identifier: String,
    pub input_dir: PathBuf,
    pub output_dir: PathBuf,
    transpiler: Transpiler,
}

impl Builder {
    pub fn new(transpiler: Transpiler, opts: BuilderOpts) -> Result<Self> {
        let scripts_input = if opts.metadata.entries.js.is_some() {
            Some(collect_js_inputs(&opts.input_dir))
        } else {
            None
        };

        let scss_input = if let Some(css) = &opts.metadata.entries.css {
            let scss = if css.ends_with(".css") {
                let mut scss = css.clone();
                scss.truncate(css.len() - 4);
                scss.push_str(".scss");
                scss
            } else {
                css.clone()
            };
            Some(opts.input_dir.join(scss))
        } else {
            None
        };

        Ok(Self {
            scripts_input,
            scss_input,
            identifier: opts.identifier,
            input_dir: opts.input_dir,
            output_dir: opts.output_dir,
            transpiler,
        })
    }

    pub fn build(&self, opts: BuildOpts) -> Result<()> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;

        let mut scripts_input = Vec::new();
        let mut unknown_files = Vec::new();

        for entry in WalkDir::new(&self.input_dir) {
            let entry = entry?;
            if !entry.file_type().is_file() {
                continue;
            }
            let path = entry.path();
            let rel = self.get_relative_path(path);
            let file_type = parse_file_type(path, &rel);
            match file_type {
                FileType::ToJS => scripts_input.push(path.to_path_buf()),
                FileType::UNKNOWN => unknown_files.push(rel),
                _ => {}
            }
        }

        let mut did_work = false;

        if opts.js && self.scripts_input.is_some() {
            did_work = true;
            self.js(&scripts_input, now)?;
        }

        if opts.css {
            if let Some(input) = &self.scss_input {
                did_work = true;
                self.css(input)?;
            }
        }

        if opts.unknown {
            for rel in &unknown_files {
                did_work = true;
                self.copy_file(rel)?;
            }
        }

        if did_work {
            let timestamp = self.output_dir.join("timestamp");
            if self.transpiler.dev {
                ensure_parent(&timestamp)?;
                fs::write(&timestamp, format!("{now}")).with_context(|| {
                    format!("Failed to write timestamp: {}", timestamp.display())
                })?;
            } else if let Err(err) = fs::remove_file(&timestamp) {
                if err.kind() != std::io::ErrorKind::NotFound {
                    return Err(err).with_context(|| {
                        format!("Failed to remove timestamp: {}", timestamp.display())
                    });
                }
            }
        }

        Ok(())
    }

    pub fn get_relative_path(&self, abs: &Path) -> PathBuf {
        abs.strip_prefix(&self.input_dir)
            .unwrap_or(abs)
            .to_path_buf()
    }

    pub fn get_input_path(&self, rel: &Path) -> PathBuf {
        self.input_dir.join(rel)
    }

    pub fn get_output_path(&self, rel: &Path) -> PathBuf {
        self.output_dir.join(rel)
    }

    pub fn js(&self, inputs: &[PathBuf], timestamp: u64) -> Result<()> {
        for input in inputs {
            let rel = self.get_relative_path(input);
            let mut rel_js = rel.clone();
            rel_js.set_extension("js");
            let output = self.get_output_path(&rel_js);
            let rel_js_str = normalize_slashes(&rel_js);
            let filepath = format!("/modules{}/{}", self.identifier, rel_js_str);
            self.transpiler
                .js(input, &output, &self.input_dir, &filepath, timestamp)?;
        }
        Ok(())
    }

    pub fn css(&self, input: &Path) -> Result<()> {
        let rel = self.get_relative_path(input);
        let mut rel_css = rel.clone();
        rel_css.set_extension("css");
        let output = self.get_output_path(&rel_css);
        self.transpiler
            .css(input, &output, self.scripts_input.as_deref().unwrap_or(&[]))?;
        Ok(())
    }

    pub fn copy_file(&self, rel: &Path) -> Result<()> {
        let input = self.get_input_path(rel);
        let output = self.get_output_path(rel);
        ensure_parent(&output)?;
        fs::copy(&input, &output).with_context(|| {
            format!("Failed to copy {} to {}", input.display(), output.display())
        })?;
        Ok(())
    }
}

pub enum FileType {
    ToJS,
    ToCSS,
    JS,
    CSS,
    UNKNOWN,
}

pub fn parse_file_type(path: &Path, rel: &Path) -> FileType {
    match path.extension().and_then(|ext| ext.to_str()).unwrap_or("") {
        "js" => FileType::JS,
        "ts" => {
            if rel.to_string_lossy().ends_with(".d.ts") {
                FileType::UNKNOWN
            } else {
                FileType::ToJS
            }
        }
        "mjs" | "jsx" | "tsx" => FileType::ToJS,
        "css" => FileType::CSS,
        "scss" => FileType::ToCSS,
        _ => FileType::UNKNOWN,
    }
}

fn collect_js_inputs(root: &Path) -> Vec<PathBuf> {
    let mut inputs = Vec::new();
    for entry in WalkDir::new(root) {
        if let Ok(entry) = entry {
            if !entry.file_type().is_file() {
                continue;
            }
            let path = entry.path();
            let rel = path.strip_prefix(root).unwrap_or(path).to_path_buf();
            if matches!(parse_file_type(path, &rel), FileType::ToJS) {
                inputs.push(path.to_path_buf());
            }
        }
    }
    inputs
}
