use anyhow::{Result, bail};
use url::Url;

use crate::app::AppContext;
use crate::infrastructure::ports::UriLauncherPort;

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

fn perform_action(ctx: &AppContext, action: &str, uri: &Url) -> Result<()> {
    let paths = crate::module::ModulePaths::from_config(&ctx.config_path);
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
            let id = crate::module::vault::StoreIdentifier::parse(&get("id").unwrap_or_default())?;
            let artifacts = get_all("artifacts");
            let checksum = get("checksum").unwrap_or_default();

            crate::module::add_store_in_vault(
                &paths,
                &id,
                crate::module::Store {
                    installed: false,
                    artifacts,
                    checksum,
                },
            )?;

            if action == "add" {
                return Ok(());
            }

            crate::module::install_module(&paths, &id)?;

            if action == "fast-install" {
                return Ok(());
            }

            crate::module::enable_module_in_vault(&paths, &id)
        }
        "install" => {
            let id = crate::module::vault::StoreIdentifier::parse(&get("id").unwrap_or_default())?;
            crate::module::install_module(&paths, &id)
        }
        "enable" => {
            let id = crate::module::vault::StoreIdentifier::parse(&get("id").unwrap_or_default())?;
            crate::module::enable_module_in_vault(&paths, &id)
        }
        "delete" => {
            let id = crate::module::vault::StoreIdentifier::parse(&get("id").unwrap_or_default())?;
            crate::module::delete_module(&paths, &id)
        }
        "remove" => {
            let id = crate::module::vault::StoreIdentifier::parse(&get("id").unwrap_or_default())?;
            crate::module::remove_store_in_vault(&paths, &id)
        }
        "fast-delete" | "fast-remove" => {
            let id = crate::module::vault::StoreIdentifier::parse(&get("id").unwrap_or_default())?;
            let disable = crate::module::vault::StoreIdentifier {
                module_identifier: id.module_identifier.clone(),
                version: String::new(),
            };
            crate::module::enable_module_in_vault(&paths, &disable)?;
            crate::module::delete_module(&paths, &id)?;
            if action == "fast-remove" {
                crate::module::remove_store_in_vault(&paths, &id)?;
            }
            Ok(())
        }
        _ => bail!("this operation is not supported"),
    }
}

