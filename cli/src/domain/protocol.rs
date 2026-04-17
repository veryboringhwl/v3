use anyhow::{Result, bail};
use url::Url;

use crate::core::app::AppContext;
use crate::infrastructure::ports::UriLauncherPort;
use crate::module;

pub fn run_with(ctx: &AppContext, uri: &str, launcher: &dyn UriLauncherPort) -> Result<()> {
    let response = handle_protocol(ctx, uri)?;
    if !response.is_empty() {
        let outbound = format!("spotify:app:rpc:{}", response);
        launcher.open_uri(&outbound)?;
    }
    Ok(())
}

pub fn handle_protocol(ctx: &AppContext, uri: &str) -> Result<String> {
    let u = Url::parse(uri)?;
    if u.scheme() != "spicetify" {
        bail!("unsupported scheme")
    }

    let opaque = u.path();
    let mut parts = opaque.split(':');
    let uuid = parts.next().unwrap_or_default();
    let action = parts.next().unwrap_or_default();

    let response_prefix = format!("spicetify:{}:", uuid);
    let result = perform_action(ctx, action, &u);

    let mut response = response_prefix;
    if result.is_ok() {
        response.push('1');
    } else {
        response.push('0');
    }

    result?;

    if uuid == "0" {
        Ok(String::new())
    } else {
        Ok(response)
    }
}

fn parse_enable_identifier(raw: &str) -> Result<module::vault::StoreIdentifier> {
    if let Some(module_identifier) = raw.strip_suffix('@') {
        if module_identifier.is_empty() || module_identifier.contains('@') {
            bail!("invalid store id, expected module@version")
        }

        return Ok(module::vault::StoreIdentifier {
            module_identifier: module_identifier.to_string(),
            version: String::new(),
        });
    }

    module::vault::StoreIdentifier::parse(raw)
}

fn parse_module_identifier(raw: &str) -> Result<String> {
    if raw.is_empty() {
        bail!("invalid module id")
    }

    if let Some(module_identifier) = raw.strip_suffix('@') {
        if module_identifier.is_empty() || module_identifier.contains('@') {
            bail!("invalid module id")
        }
        return Ok(module_identifier.to_string());
    }

    if raw.contains('@') {
        bail!("invalid module id")
    }

    Ok(raw.to_string())
}

fn perform_action(ctx: &AppContext, action: &str, uri: &Url) -> Result<()> {
    let paths = module::ModulePaths::from_config(&ctx.config_path);
    let query = uri.query_pairs().collect::<Vec<_>>();

    let get = |key: &str| -> Option<String> {
        query
            .iter()
            .find(|(k, _)| k == key)
            .map(|(_, v)| v.to_string())
    };
    let get_all = |key: &str| -> Vec<String> {
        query
            .iter()
            .filter(|(k, _)| k == key)
            .map(|(_, v)| v.to_string())
            .collect()
    };

    match action {
        "add" | "fast-install" | "fast-enable" => {
            let id = module::vault::StoreIdentifier::parse(&get("id").unwrap_or_default())?;
            let artifacts = get_all("artifacts");
            let checksum = get("checksum").unwrap_or_default();

            module::add_store_in_vault(
                &paths,
                &id,
                module::Store {
                    installed: false,
                    artifacts,
                    checksum,
                },
            )?;

            if action == "add" {
                return Ok(());
            }

            module::install_module(&paths, &id)?;

            if action == "fast-install" {
                return Ok(());
            }

            module::enable_module_in_vault(&paths, &id)
        }
        "install" => {
            let id = module::vault::StoreIdentifier::parse(&get("id").unwrap_or_default())?;
            module::install_module(&paths, &id)
        }
        "enable" => {
            let id = parse_enable_identifier(&get("id").unwrap_or_default())?;
            module::enable_module_in_vault(&paths, &id)
        }
        "disable" => {
            let module_identifier = parse_module_identifier(&get("id").unwrap_or_default())?;
            let id = module::vault::StoreIdentifier {
                module_identifier,
                version: String::new(),
            };
            module::enable_module_in_vault(&paths, &id)
        }
        "delete" => {
            let id = module::vault::StoreIdentifier::parse(&get("id").unwrap_or_default())?;
            module::delete_module(&paths, &id)
        }
        "remove" => {
            let id = module::vault::StoreIdentifier::parse(&get("id").unwrap_or_default())?;
            module::remove_store_in_vault(&paths, &id)
        }
        "fast-delete" | "fast-remove" => {
            let id = module::vault::StoreIdentifier::parse(&get("id").unwrap_or_default())?;
            let disable = module::vault::StoreIdentifier {
                module_identifier: id.module_identifier.clone(),
                version: String::new(),
            };
            module::enable_module_in_vault(&paths, &disable)?;
            module::delete_module(&paths, &id)?;
            if action == "fast-remove" {
                module::remove_store_in_vault(&paths, &id)?;
            }
            Ok(())
        }
        _ => bail!("this operation is not supported"),
    }
}
