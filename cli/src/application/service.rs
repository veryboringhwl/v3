use anyhow::Result;

use crate::core::app::AppContext;
use crate::core::cli::{DaemonAction, PkgAction, SpicetifyCommand, SpotifyCommand, UpdateMode};
use crate::domain::{
    apply, config as domain_config, daemon, dev, fix, init, pkg, protocol, run as spotify_run,
    sync, update,
};
use crate::infrastructure::ports::ApplicationPorts;

pub struct ApplicationService<P: ApplicationPorts> {
    ports: P,
}

impl<P: ApplicationPorts> ApplicationService<P> {
    pub fn new(ports: P) -> Self {
        Self { ports }
    }

    pub fn execute_spicetify(&self, command: SpicetifyCommand, ctx: &AppContext) -> Result<()> {
        match command {
            SpicetifyCommand::Apply => {
                apply::run_with(
                    ctx,
                    self.ports.fs(),
                    self.ports.archive(),
                    self.ports.linking(),
                    self.ports.logger(),
                )?;
                self.ports.logger().info("Patched Spotify");
                self.ports.spotify_process().restart_if_running(ctx)?;
                Ok(())
            }
            SpicetifyCommand::Config => domain_config::run_with(ctx, self.ports.logger()),
            SpicetifyCommand::Daemon { action } => match action {
                Some(DaemonAction::Start) => {
                    self.ports.logger().info("Starting daemon");
                    daemon::start_with(ctx, self.ports.daemon())
                }
                Some(DaemonAction::Enable) => {
                    self.ports.logger().info("Enabling daemon");
                    daemon::enable_with(ctx, self.ports.config())
                }
                Some(DaemonAction::Disable) => {
                    self.ports.logger().info("Disabling daemon");
                    daemon::disable_with(ctx, self.ports.config())
                }
                None => {
                    if ctx.daemon {
                        self.ports.logger().info("Starting daemon");
                        daemon::start_with(ctx, self.ports.daemon())
                    } else {
                        Ok(())
                    }
                }
            },
            SpicetifyCommand::Dev => {
                dev::run_with(ctx, self.ports.fs())?;
                self.ports.logger().info("Mode app-developer enabled");
                self.ports.spotify_process().restart_if_running(ctx)?;
                Ok(())
            }
            SpicetifyCommand::Fix => {
                fix::run_with(ctx, self.ports.fs(), self.ports.logger())?;
                self.ports.logger().info("Restored Spotify to stock state");
                self.ports.spotify_process().restart_if_running(ctx)?;
                Ok(())
            }
            SpicetifyCommand::Init => {
                init::run_with(ctx, self.ports.fs(), self.ports.config())?;
                self.ports.logger().info("Initialized spicetify");
                Ok(())
            }
            SpicetifyCommand::Pkg { action } => match action {
                PkgAction::Install { id, url } => {
                    pkg::install_with(ctx, &id, &url, self.ports.fs())?;
                    self.ports.logger().info("Module added");
                    Ok(())
                }
                PkgAction::Delete { id } => {
                    pkg::delete_with(ctx, &id)?;
                    self.ports.logger().info("Module deleted");
                    Ok(())
                }
                PkgAction::Enable { id } => {
                    pkg::enable_with(ctx, &id)?;
                    self.ports.logger().info("Module enabled");
                    Ok(())
                }
            },
            SpicetifyCommand::Protocol { uri } => {
                protocol::run_with(ctx, &uri, self.ports.uri_launcher())
            }
            SpicetifyCommand::Sync => {
                sync::run_with(
                    ctx,
                    self.ports.network(),
                    self.ports.fs(),
                    self.ports.archive(),
                )?;
                self.ports.logger().info("Hooks updated successfully");
                Ok(())
            }
            SpicetifyCommand::Update { mode } => {
                if matches!(mode, UpdateMode::Off) {
                    self.ports.spotify_process().stop(ctx)?;
                }
                update::run_with(ctx, mode.as_str(), self.ports.fs(), self.ports.logger())?;
                self.ports
                    .logger()
                    .info("Patched the executable successfully");
                Ok(())
            }
        }
    }

    pub fn execute_spotify(&self, command: SpotifyCommand, ctx: &AppContext) -> Result<()> {
        match command {
            SpotifyCommand::Run { args } => spotify_run::run_with(ctx, &args, self.ports.process()),
            SpotifyCommand::Update { mode } => {
                if matches!(mode, UpdateMode::Off) {
                    self.ports.spotify_process().stop(ctx)?;
                }
                update::run_with(ctx, mode.as_str(), self.ports.fs(), self.ports.logger())?;
                self.ports
                    .logger()
                    .info("Patched the executable successfully");
                Ok(())
            }
        }
    }
}
