mod builder;
mod classmap;
mod scaffold;
mod timestamp;
mod transpile;
mod util;
mod watch;

use std::{fs, path::{Path, PathBuf}};

use anyhow::{anyhow, Context, Result};
use builder::{BuildOpts, Builder, BuilderOpts, Metadata};
use clap::{Parser, Subcommand};
use classmap::{discover_module_dirs, fetch_classmap_info, gen_classmap_dts, Mapping};
use scaffold::{CreateCommandInput, InitCommandInput, ModuleTemplate};
use transpile::Transpiler;
use util::{read_json, write_text};

const CLASSMAP_URL_ENV: &str = "CREATOR_CLASSMAP_URL";
const CLASSMAP_URL_FILE: &str = "classmap.url";

#[derive(Parser)]
#[command(name = "creator", version, about = "Rust build tool for v3 modules")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    Create {
        #[arg(long = "name")]
        name: Option<String>,

        #[arg(long = "dir", default_value = "modules")]
        dir: PathBuf,

        #[arg(long = "author")]
        author: Option<String>,

        #[arg(long = "description", default_value = "")]
        description: String,

        #[arg(long = "force", default_value_t = false)]
        force: bool,

        #[arg(long = "interactive", short = 'i', default_value_t = false)]
        interactive: bool,

        #[arg(long = "tsx", default_value_t = false)]
        tsx: bool,

        #[arg(long = "template", value_enum)]
        template: Option<ModuleTemplate>,
    },
    Init {
        #[arg(long = "name")]
        name: String,

        #[arg(long = "dir", default_value = "modules")]
        dir: PathBuf,

        #[arg(long = "author")]
        author: Option<String>,

        #[arg(long = "description", default_value = "")]
        description: String,

        #[arg(long = "force", default_value_t = false)]
        force: bool,

        #[arg(long = "template", value_enum, default_value = "custom-app")]
        template: ModuleTemplate,
    },
    ClassmapFetch {
        #[arg(long = "url")]
        url: Option<String>,

        #[arg(long = "output", default_value = "classmap.json")]
        output: PathBuf,

        #[arg(long = "modules-dir", default_value = "modules")]
        modules_dir: PathBuf,
    },
    BuildRelease {
        #[arg(value_name = "INPUT_DIRS")]
        inputs: Vec<PathBuf>,

        #[arg(long = "classmap-url")]
        classmap_url: Option<String>,

        #[arg(long = "output-dir", default_value = "dist")]
        output_dir: PathBuf,
    },
    Build {
        #[arg(long = "module")]
        module: Option<String>,

        #[arg(short = 'i', long = "input-dir")]
        input_dir: PathBuf,

        #[arg(short = 'o', long = "output-dir")]
        output_dir: PathBuf,

        #[arg(short = 'c', long = "classmap", default_value = "classmap.json")]
        classmap: PathBuf,

        #[arg(short = 'b', long = "build", default_value_t = false)]
        _build: bool,

        #[arg(short = 'w', long = "watch", default_value_t = false)]
        watch: bool,

        #[arg(long = "debounce", default_value_t = 1000)]
        debounce: i64,

        #[arg(long = "dev", default_value_t = false)]
        dev: bool,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Command::Create {
            name,
            dir,
            author,
            description,
            force,
            interactive,
            tsx,
            template,
        } => scaffold::run_create(CreateCommandInput {
            name,
            dir,
            author,
            description,
            force,
            interactive,
            tsx,
            template,
        }),
        Command::Init {
            name,
            dir,
            author,
            description,
            force,
            template,
        } => scaffold::run_init(InitCommandInput {
            name,
            dir,
            author,
            description,
            force,
            template,
        }),
        Command::ClassmapFetch {
            url,
            output,
            modules_dir,
        } => {
            let classmap_url = resolve_classmap_url(url)?;
            run_classmap_fetch(&classmap_url, &output, &modules_dir)
        }
        Command::BuildRelease {
            inputs,
            classmap_url,
            output_dir,
        } => {
            let classmap_url = resolve_classmap_url(classmap_url)?;
            run_build_release(inputs, &classmap_url, &output_dir)
        }
        Command::Build {
            module,
            input_dir,
            output_dir,
            classmap,
            _build,
            watch,
            debounce,
            dev,
        } => run_build(module, input_dir, output_dir, classmap, watch, debounce, dev),
    }
}

fn run_build(
    module: Option<String>,
    input_dir: PathBuf,
    output_dir: PathBuf,
    classmap: PathBuf,
    watch: bool,
    debounce: i64,
    dev: bool,
) -> Result<()> {
    let metadata_path = input_dir.join("metadata.json");
    let metadata: Metadata =
        read_json(&metadata_path).with_context(|| format!("Failed to read {}", metadata_path.display()))?;

    let identifier = match module {
        Some(name) => name,
        None => metadata
            .name
            .clone()
            .ok_or_else(|| anyhow!("--module is required when metadata.name is missing"))?,
    };

    let mapping: Mapping =
        read_json(&classmap).with_context(|| format!("Failed to read {}", classmap.display()))?;

    let builder = Builder::new(
        Transpiler::new(mapping, dev),
        BuilderOpts {
            metadata,
            identifier,
            input_dir,
            output_dir,
        },
    )?;

    builder.build(BuildOpts {
        js: true,
        css: true,
        unknown: false,
    })?;

    if watch {
        watch::watch(&builder, debounce)?;
    }

    Ok(())
}

fn resolve_classmap_url(cli_value: Option<String>) -> Result<String> {
    if let Some(url) = cli_value {
        return Ok(url);
    }

    if let Ok(url) = std::env::var(CLASSMAP_URL_ENV) {
        let trimmed = url.trim();
        if !trimmed.is_empty() {
            return Ok(trimmed.to_string());
        }
    }

    let script_paths = [
        Path::new("scripts").join("classmap-info.ts"),
        Path::new("scripts").join("classmap-info.js"),
        PathBuf::from("classmap-info.ts"),
        PathBuf::from("classmap-info.js"),
    ];

    for script_path in script_paths {
        if script_path.exists() {
            let script = fs::read_to_string(&script_path)
                .with_context(|| format!("Failed to read {}", script_path.display()))?;
            if let Some(url) = extract_classmap_url_from_script(&script) {
                return Ok(url);
            }
        }
    }

    let file_path = Path::new(CLASSMAP_URL_FILE);
    if file_path.exists() {
        let url = fs::read_to_string(file_path)
            .with_context(|| format!("Failed to read {}", file_path.display()))?;
        let trimmed = url.trim();
        if trimmed.is_empty() {
            return Err(anyhow!("{} is empty", file_path.display()));
        }
        return Ok(trimmed.to_string());
    }

    Err(anyhow!(
        "No classmap URL found. Please specify it via --url, the {} environment variable, {} or in a classmap-info script.",
        CLASSMAP_URL_ENV,
        CLASSMAP_URL_FILE
    ))
}

fn extract_classmap_url_from_script(script: &str) -> Option<String> {
    script
        .split(|ch: char| ch.is_whitespace() || ch == '\"' || ch == '\'' || ch == '`')
        .find(|token| {
            token.starts_with("https://raw.githubusercontent.com/")
                && token.contains("/classmaps/")
                && token.ends_with("/classmap.json")
        })
        .map(ToString::to_string)
}

fn run_classmap_fetch(url: &str, output: &Path, modules_dir: &Path) -> Result<()> {
    let info = fetch_classmap_info(url)?;
    let classmap_json =
        serde_json::to_string(&info.mapping).context("Failed to serialize classmap to JSON")?;

    write_text(output, &classmap_json)?;
    println!("Fetched and saved classmap to {}", output.display());

    let modules = discover_module_dirs(modules_dir)?;
    let dts = gen_classmap_dts(&info.mapping);
    for module in modules {
        let dts_path = module.join("classmap.d.ts");
        write_text(&dts_path, &dts)?;
    }

    Ok(())
}

fn run_build_release(inputs: Vec<PathBuf>, classmap_url: &str, output_dir: &Path) -> Result<()> {
    let info = fetch_classmap_info(classmap_url)?;

    let input_dirs = if inputs.is_empty() {
        discover_module_dirs(Path::new("modules"))?
    } else {
        inputs
    };

    for input_dir in input_dirs {
        let metadata_path = input_dir.join("metadata.json");
        let metadata_raw = fs::read_to_string(&metadata_path)
            .with_context(|| format!("Failed to read metadata: {}", metadata_path.display()))?;

        let metadata: Metadata = serde_json::from_str(&metadata_raw)
            .with_context(|| format!("Failed to parse metadata: {}", metadata_path.display()))?;
        let metadata_value: serde_json::Value =
            serde_json::from_str(&metadata_raw).with_context(|| {
                format!("Failed to parse metadata JSON: {}", metadata_path.display())
            })?;

        build_release_with_classmap(&input_dir, &metadata, metadata_value, &info, output_dir)?;
    }

    Ok(())
}

fn build_release_with_classmap(
    input_dir: &Path,
    metadata: &Metadata,
    metadata_value: serde_json::Value,
    info: &classmap::ClassmapInfo,
    output_root: &Path,
) -> Result<()> {
    let mut metadata_out = metadata_value;
    let version = metadata_out
        .get_mut("version")
        .and_then(|value| value.as_str().map(|s| s.to_string()))
        .ok_or_else(|| anyhow!("metadata.version is missing"))?;

    let classmap_semver = classmap_semver_from_packed(info.version);
    let new_version = format!("{}+{}", version, classmap_semver);
    *metadata_out
        .get_mut("version")
        .ok_or_else(|| anyhow!("metadata.version is missing"))? =
        serde_json::Value::String(new_version);

    let identifier = metadata
        .name
        .clone()
        .ok_or_else(|| anyhow!("metadata.name is missing"))?;
    let fingerprint = format!(
        "{}@{}",
        identifier,
        metadata_out
            .get("version")
            .and_then(|value| value.as_str())
            .unwrap_or("0.0.0")
    );
    let output_dir = output_root.join(&fingerprint);
    fs::create_dir_all(&output_dir)
        .with_context(|| format!("Failed to create output dir: {}", output_dir.display()))?;

    let transpiler = Transpiler::new(info.mapping.clone(), false);
    let builder = Builder::new(
        transpiler,
        BuilderOpts {
            metadata: metadata.clone(),
            identifier,
            input_dir: input_dir.to_path_buf(),
            output_dir: output_dir.clone(),
        },
    )?;

    let build_result = builder.build(BuildOpts {
        js: true,
        css: true,
        unknown: true,
    });

    match build_result {
        Ok(()) => {
            let metadata_path = output_dir.join("metadata.json");
            let metadata_json =
                serde_json::to_string(&metadata_out).context("Failed to serialize metadata.json")?;
            write_text(&metadata_path, &metadata_json)?;
        }
        Err(err) => {
            let _ = fs::remove_dir_all(&output_dir);
            println!("Build for {} failed with error: {}", fingerprint, err);
        }
    }

    Ok(())
}

fn classmap_semver_from_packed(version: u64) -> String {
    let major = version / 1_000_000;
    let minor = (version / 1_000) % 1_000;
    let patch = version % 1_000;
    format!("{}.{}.{}", major, minor, patch)
}
