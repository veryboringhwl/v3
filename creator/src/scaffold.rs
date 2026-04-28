use std::{
    fs,
    io::{self, Write},
    path::{Path, PathBuf},
};

use anyhow::{anyhow, Context, Result};
use clap::ValueEnum;

use crate::util::write_text;

#[derive(Clone, Copy, Debug, ValueEnum)]
pub enum ModuleTemplate {
    #[value(name = "custom-app")]
    CustomApp,
    #[value(name = "extension")]
    Extension,
}

#[derive(Debug)]
pub struct CreateCommandInput {
    pub name: Option<String>,
    pub dir: PathBuf,
    pub author: Option<String>,
    pub description: String,
    pub force: bool,
    pub interactive: bool,
    pub tsx: bool,
    pub template: Option<ModuleTemplate>,
}

#[derive(Debug)]
pub struct InitCommandInput {
    pub name: String,
    pub dir: PathBuf,
    pub author: Option<String>,
    pub description: String,
    pub force: bool,
    pub template: ModuleTemplate,
}

#[derive(Debug)]
struct CreateOpts {
    name: String,
    dir: PathBuf,
    author: Option<String>,
    description: String,
    force: bool,
    template: ModuleTemplate,
}

pub fn run_create(command: CreateCommandInput) -> Result<()> {
    let cwd = std::env::current_dir().context("Failed to get current directory")?;
    let in_modules_repo = detect_spicetify_modules_repo(&cwd);

    let opts = if !in_modules_repo {
        collect_interactive_create_opts(command, true)?
    } else if command.interactive {
        collect_interactive_create_opts(command, false)?
    } else {
        let name = command
            .name
            .ok_or_else(|| anyhow!("--name is required unless --interactive is set"))?;
        let chosen_template = command.template.unwrap_or_else(|| {
            if command.tsx {
                ModuleTemplate::CustomApp
            } else {
                ModuleTemplate::Extension
            }
        });

        CreateOpts {
            name,
            dir: command.dir,
            author: command.author,
            description: command.description,
            force: command.force,
            template: chosen_template,
        }
    };

    if in_modules_repo {
        run_init(InitCommandInput {
            name: opts.name,
            dir: opts.dir,
            author: opts.author,
            description: opts.description,
            force: opts.force,
            template: opts.template,
        })
    } else {
        run_bootstrap_project(&opts)
    }
}

pub fn run_init(command: InitCommandInput) -> Result<()> {
    if command.name.trim().is_empty() {
        return Err(anyhow!("--name must not be empty"));
    }

    let module_dir = command.dir.join(&command.name);
    if module_dir.exists() {
        if !command.force {
            return Err(anyhow!(
                "Module directory already exists: {} (use --force to overwrite template files)",
                module_dir.display()
            ));
        }
    } else {
        fs::create_dir_all(&module_dir)
            .with_context(|| format!("Failed to create module dir: {}", module_dir.display()))?;
    }

    let author = command
        .author
        .or_else(|| std::env::var("USERNAME").ok())
        .unwrap_or_else(|| "author".to_string());

    let files = render_module_files(
        command.template,
        &command.name,
        &author,
        if command.description.trim().is_empty() {
            "A Spicetify v3 module"
        } else {
            command.description.as_str()
        },
    )?;

    for (rel, contents) in files {
        write_text(&module_dir.join(rel), &contents)?;
    }

    println!("Initialized module template at {}", module_dir.display());
    println!(
        "Template: {}",
        match command.template {
            ModuleTemplate::CustomApp => "custom-app (TSX)",
            ModuleTemplate::Extension => "extension (TS)",
        }
    );

    Ok(())
}

fn collect_interactive_create_opts(command: CreateCommandInput, force_prompts: bool) -> Result<CreateOpts> {
    println!("create-spicetify-module wizard");

    let module_name = match command.name {
        Some(value) if !value.trim().is_empty() => value,
        _ => prompt_required("Module name")?,
    };

    let module_description = if command.description.trim().is_empty() {
        prompt_default("Description", "A Spicetify v3 module")?
    } else {
        command.description
    };

    let module_author = match command.author {
        Some(value) if !value.trim().is_empty() => Some(value),
        _ => {
            let guessed = std::env::var("USERNAME").unwrap_or_else(|_| "author".to_string());
            Some(prompt_default("Author", &guessed)?)
        }
    };

    let selected_template = if let Some(value) = command.template {
        value
    } else if command.tsx {
        ModuleTemplate::CustomApp
    } else {
        prompt_template()?
    };

    let use_force = if command.force {
        true
    } else if force_prompts {
        prompt_yes_no("Overwrite existing files if present?", false)?
    } else {
        false
    };

    Ok(CreateOpts {
        name: module_name,
        dir: command.dir,
        author: module_author,
        description: module_description,
        force: use_force,
        template: selected_template,
    })
}

fn detect_spicetify_modules_repo(cwd: &Path) -> bool {
    (cwd.join("deno.json").exists() && cwd.join("modules").is_dir())
        || cwd.join("modules").join("deno.json").exists()
}

fn run_bootstrap_project(opts: &CreateOpts) -> Result<()> {
    let project_root = PathBuf::from(&opts.name);

    if project_root.exists() {
        if !opts.force {
            return Err(anyhow!(
                "Project directory already exists: {} (use --force to overwrite files)",
                project_root.display()
            ));
        }
    } else {
        fs::create_dir_all(&project_root)
            .with_context(|| format!("Failed to create project dir: {}", project_root.display()))?;
    }

    for (rel, contents) in render_project_files() {
        write_text(&project_root.join(rel), &contents)?;
    }

    run_init(InitCommandInput {
        name: opts.name.clone(),
        dir: project_root.join("modules"),
        author: opts.author.clone(),
        description: opts.description.clone(),
        force: true,
        template: opts.template,
    })?;

    println!("\nNow run deno task win:build");

    Ok(())
}

fn render_module_files(
    template: ModuleTemplate,
    module_name: &str,
    author: &str,
    description: &str,
) -> Result<Vec<(PathBuf, String)>> {
    let base = match template {
        ModuleTemplate::CustomApp => module_files_custom_app(),
        ModuleTemplate::Extension => module_files_extension(),
    };

    Ok(base
        .into_iter()
        .map(|(rel, raw)| {
            (
                rel,
                apply_tokens(
                    raw,
                    &[
                        ("MODULE_NAME", module_name),
                        ("AUTHOR", author),
                        ("DESCRIPTION", description),
                    ],
                ),
            )
        })
        .collect())
}

fn render_project_files() -> Vec<(PathBuf, String)> {
    vec![
        (PathBuf::from("deno.json"), PROJECT_DENO_JSON.to_string()),
        (
            PathBuf::from("classmap.json"),
            PROJECT_CLASSMAP_JSON.to_string(),
        ),
        (PathBuf::from("vault.json"), PROJECT_VAULT_JSON.to_string()),
        (PathBuf::from(".gitignore"), PROJECT_GITIGNORE.to_string()),
        (
            PathBuf::from(".editorconfig"),
            PROJECT_EDITORCONFIG.to_string(),
        ),
        (
            PathBuf::from("scripts/build-dev.ps1"),
            PROJECT_BUILD_DEV_PS1.to_string(),
        ),
        (
            PathBuf::from("scripts/watch-dev.ps1"),
            PROJECT_WATCH_DEV_PS1.to_string(),
        ),
        (
            PathBuf::from("scripts/enable-dev.ps1"),
            PROJECT_ENABLE_DEV_PS1.to_string(),
        ),
        (
            PathBuf::from("scripts/build-dev.sh"),
            PROJECT_BUILD_DEV_SH.to_string(),
        ),
        (
            PathBuf::from("scripts/watch-dev.sh"),
            PROJECT_WATCH_DEV_SH.to_string(),
        ),
        (
            PathBuf::from("scripts/enable-dev.sh"),
            PROJECT_ENABLE_DEV_SH.to_string(),
        ),
        (
            PathBuf::from("scripts/build-local.ts"),
            PROJECT_BUILD_LOCAL_TS.to_string(),
        ),
        (
            PathBuf::from("scripts/build-shared.ts"),
            PROJECT_BUILD_SHARED_TS.to_string(),
        ),
        (PathBuf::from("scripts/cron.ts"), PROJECT_CRON_TS.to_string()),
    ]
}

fn module_files_custom_app() -> Vec<(PathBuf, &'static str)> {
    vec![
        (PathBuf::from("metadata.json"), MODULE_CUSTOM_APP_METADATA),
        (PathBuf::from("index.ts"), MODULE_CUSTOM_APP_INDEX_TS),
        (PathBuf::from("load.ts"), MODULE_CUSTOM_APP_LOAD_TS),
        (PathBuf::from("mixin.ts"), MODULE_CUSTOM_APP_MIXIN_TS),
        (PathBuf::from("index.css"), MODULE_CUSTOM_APP_CSS),
    ]
}

fn module_files_extension() -> Vec<(PathBuf, &'static str)> {
    vec![
        (PathBuf::from("metadata.json"), MODULE_EXTENSION_METADATA),
        (PathBuf::from("index.ts"), MODULE_EXTENSION_INDEX_TS),
        (PathBuf::from("load.ts"), MODULE_EXTENSION_LOAD_TS),
        (PathBuf::from("mixin.ts"), MODULE_EXTENSION_MIXIN_TS),
        (PathBuf::from("index.css"), MODULE_EXTENSION_CSS),
    ]
}

fn apply_tokens(input: &str, tokens: &[(&str, &str)]) -> String {
    let mut output = input.to_string();
    for (name, value) in tokens {
        output = output.replace(&format!("{{{{{name}}}}}"), value);
    }
    output
}

fn prompt_template() -> Result<ModuleTemplate> {
    loop {
        print!("Template [custom-app/extension] [custom-app]: ");
        io::stdout().flush().context("Failed to flush stdout")?;
        let mut input = String::new();
        io::stdin()
            .read_line(&mut input)
            .context("Failed to read interactive input")?;
        let trimmed = input.trim().to_lowercase();
        if trimmed.is_empty() || trimmed == "custom-app" || trimmed == "app" {
            return Ok(ModuleTemplate::CustomApp);
        }
        if trimmed == "extension" || trimmed == "ext" {
            return Ok(ModuleTemplate::Extension);
        }
        println!("Please enter custom-app or extension.");
    }
}

fn prompt_required(label: &str) -> Result<String> {
    loop {
        print!("{}: ", label);
        io::stdout().flush().context("Failed to flush stdout")?;
        let mut input = String::new();
        io::stdin()
            .read_line(&mut input)
            .context("Failed to read interactive input")?;
        let trimmed = input.trim();
        if !trimmed.is_empty() {
            return Ok(trimmed.to_string());
        }
        println!("Value is required.");
    }
}

fn prompt_default(label: &str, default: &str) -> Result<String> {
    print!("{} [{}]: ", label, default);
    io::stdout().flush().context("Failed to flush stdout")?;
    let mut input = String::new();
    io::stdin()
        .read_line(&mut input)
        .context("Failed to read interactive input")?;
    let trimmed = input.trim();
    if trimmed.is_empty() {
        Ok(default.to_string())
    } else {
        Ok(trimmed.to_string())
    }
}

fn prompt_yes_no(label: &str, default: bool) -> Result<bool> {
    let hint = if default { "Y/n" } else { "y/N" };
    print!("{} [{}]: ", label, hint);
    io::stdout().flush().context("Failed to flush stdout")?;
    let mut input = String::new();
    io::stdin()
        .read_line(&mut input)
        .context("Failed to read interactive input")?;
    let trimmed = input.trim().to_lowercase();
    if trimmed.is_empty() {
        return Ok(default);
    }
    Ok(matches!(trimmed.as_str(), "y" | "yes"))
}

const MODULE_CUSTOM_APP_METADATA: &str = include_str!("../templates/modules/app/metadata.json");
const MODULE_CUSTOM_APP_INDEX_TS: &str = include_str!("../templates/modules/app/index.ts");
const MODULE_CUSTOM_APP_LOAD_TS: &str = include_str!("../templates/modules/app/load.ts");
const MODULE_CUSTOM_APP_MIXIN_TS: &str = include_str!("../templates/modules/app/mixin.ts");
const MODULE_CUSTOM_APP_CSS: &str = include_str!("../templates/modules/app/index.css");

const MODULE_EXTENSION_METADATA: &str = include_str!("../templates/modules/extension/metadata.json");
const MODULE_EXTENSION_INDEX_TS: &str = include_str!("../templates/modules/extension/index.ts");
const MODULE_EXTENSION_LOAD_TS: &str = include_str!("../templates/modules/extension/load.ts");
const MODULE_EXTENSION_MIXIN_TS: &str = include_str!("../templates/modules/extension/mixin.ts");
const MODULE_EXTENSION_CSS: &str = include_str!("../templates/modules/extension/index.css");

const PROJECT_DENO_JSON: &str = include_str!("../templates/deno.json");
const PROJECT_CLASSMAP_JSON: &str = include_str!("../templates/classmap.json");
const PROJECT_VAULT_JSON: &str = include_str!("../templates/vault.json");
const PROJECT_GITIGNORE: &str = include_str!("../templates/.gitignore");
const PROJECT_EDITORCONFIG: &str = include_str!("../templates/.editorconfig");

const PROJECT_BUILD_DEV_PS1: &str = include_str!("../templates/scripts/build-dev.ps1");
const PROJECT_WATCH_DEV_PS1: &str = include_str!("../templates/scripts/watch-dev.ps1");
const PROJECT_ENABLE_DEV_PS1: &str = include_str!("../templates/scripts/enable-dev.ps1");
const PROJECT_BUILD_DEV_SH: &str = include_str!("../templates/scripts/build-dev.sh");
const PROJECT_WATCH_DEV_SH: &str = include_str!("../templates/scripts/watch-dev.sh");
const PROJECT_ENABLE_DEV_SH: &str = include_str!("../templates/scripts/enable-dev.sh");
const PROJECT_BUILD_LOCAL_TS: &str = include_str!("../templates/scripts/build-local.ts");
const PROJECT_BUILD_SHARED_TS: &str = include_str!("../templates/scripts/build-shared.ts");
const PROJECT_CRON_TS: &str = include_str!("../templates/scripts/cron.ts");
