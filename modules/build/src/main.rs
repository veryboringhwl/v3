mod builder;
mod classmap;
mod timestamp;
mod transpile;
mod util;
mod watch;

use std::{
    fs, path::{Path, PathBuf}, time::Instant
};

use anyhow::{Context, Result, anyhow};
use builder::{BuildOpts, Builder, BuilderOpts, Metadata};
use clap::{Parser, Subcommand};
use classmap::{
    Mapping, discover_module_dirs, fetch_classmap_info, gen_classmap_dts, load_mapping
};
use transpile::Transpiler;
use util::{read_json, write_text};

const GH_RAW_CLASSMAP_URL: &str =
    "https://raw.githubusercontent.com/veryboringhwl/v3/main/classmaps/1.2.88/classmap.json";

#[derive(Parser)]
#[command(name = "tailor", version, about = "Rust build tool for v3 modules")]
struct Cli {
    #[command(subcommand)]
    command: Option<Command>,

    #[arg(short = 'c', long = "classmap")]
    classmap: Option<PathBuf>,

    #[arg(short = 'i', long = "input", default_value = ".")]
    input: PathBuf,

    #[arg(short = 'o', long = "output", default_value = ".")]
    output: PathBuf,

    #[arg(long = "copy", default_value_t = false)]
    copy: bool,

    #[arg(short = 'd', long = "declaration", default_value_t = false)]
    declaration: bool,

    #[arg(short = 'b', long = "build", default_value_t = false)]
    build: bool,

    #[arg(short = 'w', long = "watch", default_value_t = false)]
    watch: bool,

    #[arg(long = "debounce", default_value_t = -1)]
    debounce: i64,

    #[arg(long = "module")]
    module: Option<String>,

    #[arg(long = "dev", default_value_t = false)]
    dev: bool,
}

#[derive(Subcommand)]
enum Command {
    ClassmapFetch {
        #[arg(long = "url", default_value = GH_RAW_CLASSMAP_URL)]
        url: String,

        #[arg(long = "output", default_value = "classmap.json")]
        output: PathBuf,

        #[arg(long = "modules-dir", default_value = "modules")]
        modules_dir: PathBuf,
    },
    BuildRelease {
        #[arg(value_name = "INPUT_DIRS")]
        inputs: Vec<PathBuf>,

        #[arg(long = "classmap-url", default_value = GH_RAW_CLASSMAP_URL)]
        classmap_url: String,

        #[arg(long = "output-dir", default_value = "dist")]
        output_dir: PathBuf,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Some(Command::ClassmapFetch {
            url,
            output,
            modules_dir,
        }) => run_classmap_fetch(&url, &output, &modules_dir),
        Some(Command::BuildRelease {
            inputs,
            classmap_url,
            output_dir,
        }) => run_build_release(inputs, &classmap_url, &output_dir),
        None => run_legacy(cli),
    }
}

fn run_legacy(cli: Cli) -> Result<()> {
    let module = cli
        .module
        .clone()
        .ok_or_else(|| anyhow!("--module is required"))?;

    let classmap = if let Some(path) = &cli.classmap {
        println!("Loading classmap...");
        load_mapping(Some(path))?
    } else {
        Mapping::default()
    };

    let metadata: Metadata = read_json(&cli.input.join("metadata.json"))?;
    let transpiler = Transpiler::new(classmap.clone(), cli.dev);
    let builder = Builder::new(
        transpiler,
        BuilderOpts {
            metadata,
            identifier: module,
            input_dir: cli.input,
            output_dir: cli.output,
        },
    )?;

    if cli.declaration {
        let dts = gen_classmap_dts(&classmap);
        let path = builder.get_input_path(Path::new("classmap.d.ts"));
        println!("Writing classmap declaration...");
        write_text(&path, &dts)?;
    }

    if cli.build {
        run_build(
            &builder,
            BuildOpts {
                js: true,
                css: true,
                unknown: cli.copy,
            },
        )?;
    }

    if cli.watch {
        watch::watch(&builder, cli.debounce)?;
    }

    Ok(())
}

fn run_build(builder: &Builder, opts: BuildOpts) -> Result<()> {
    let start = Instant::now();
    builder.build(opts)?;
    println!("Build finished in {:.2}s!", start.elapsed().as_secs_f64());
    Ok(())
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
            let metadata_json = serde_json::to_string(&metadata_out)
                .context("Failed to serialize metadata.json")?;
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
