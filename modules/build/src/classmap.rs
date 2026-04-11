use std::{
    collections::HashMap, path::{Path, PathBuf}
};

use anyhow::{Context, Result, anyhow};
use regex::Regex;
use serde::{Deserialize, Serialize};

use crate::util::read_json;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(untagged)]
pub enum Mapping {
    Str(String),
    Map(HashMap<String, Mapping>),
}

impl Default for Mapping {
    fn default() -> Self {
        Mapping::Map(HashMap::new())
    }
}

#[derive(Clone, Debug)]
pub struct ClassmapInfo {
    pub mapping: Mapping,
    pub version: u64,
    pub timestamp: u64,
}

pub fn load_mapping(path: Option<&Path>) -> Result<Mapping> {
    match path {
        Some(path) => read_json(path),
        None => Ok(Mapping::default()),
    }
}

pub fn gen_classmap_dts(mapping: &Mapping) -> String {
    fn gen_type(mapping: &Mapping) -> String {
        match mapping {
            Mapping::Str(value) => format!("\"{}\"", value),
            Mapping::Map(map) => {
                let mut entries: Vec<_> = map.iter().collect();
                entries.sort_by(|a, b| a.0.cmp(b.0));
                let mut out = String::new();
                for (key, value) in entries {
                    out.push_str(&format!("readonly \"{}\":{},", key, gen_type(value)));
                }
                format!("{{{}}}", out)
            }
        }
    }

    format!(
        "/* Bespoke Tailored Classmap (BTC) */\n\ndeclare const MAP: {};\n",
        gen_type(mapping)
    )
}

pub fn reformat_mapping_for_css(mapping: &Mapping) -> Mapping {
    match mapping {
        Mapping::Str(value) => Mapping::Str(value.clone()),
        Mapping::Map(map) => {
            let mut remapped = HashMap::new();
            for (key, value) in map {
                let key = key.replace('_', "-");
                remapped.insert(key, reformat_mapping_for_css(value));
            }
            Mapping::Map(remapped)
        }
    }
}

pub fn fetch_classmap_info(url: &str) -> Result<ClassmapInfo> {
    let url_re = Regex::new(
        r"^https://raw\.githubusercontent\.com/[^/]+/[^/]+/[^/]+/(?P<version>\d{7})/classmap-(?P<timestamp>[0-9a-f]{11})\.json$",
    )?;
    let caps = url_re
        .captures(url)
        .ok_or_else(|| anyhow!("Invalid classmap url: {url}"))?;
    let version: u64 = caps
        .name("version")
        .ok_or_else(|| anyhow!("Missing classmap version in url: {url}"))?
        .as_str()
        .parse()
        .with_context(|| format!("Invalid classmap version in url: {url}"))?;
    let timestamp = u64::from_str_radix(
        caps.name("timestamp")
            .ok_or_else(|| anyhow!("Missing classmap timestamp in url: {url}"))?
            .as_str(),
        16,
    )
    .with_context(|| format!("Invalid classmap timestamp in url: {url}"))?;

    let response = reqwest::blocking::get(url)
        .with_context(|| format!("Failed to fetch classmap from {url}"))?;
    let mapping: Mapping = response
        .json()
        .with_context(|| format!("Failed to parse classmap from {url}"))?;

    Ok(ClassmapInfo {
        mapping,
        version,
        timestamp,
    })
}

pub fn discover_module_dirs(modules_dir: &Path) -> Result<Vec<PathBuf>> {
    let mut dirs = Vec::new();
    for entry in std::fs::read_dir(modules_dir)
        .with_context(|| format!("Failed to read modules dir: {}", modules_dir.display()))?
    {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            dirs.push(path);
        }
    }
    Ok(dirs)
}
