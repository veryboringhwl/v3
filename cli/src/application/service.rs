use anyhow::Result;

use crate::app::AppContext;
use crate::cli::{DaemonAction, PkgAction, SpicetifyCommand, SpotifyCommand, UpdateMode};
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
                crate::domain::spicetify::apply::run_with(
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
            SpicetifyCommand::Config => {
                crate::domain::spicetify::config::run_with(ctx, self.ports.logger())
            }
            SpicetifyCommand::Daemon { action } => match action {
                Some(DaemonAction::Start) => {
                    self.ports.logger().info("Starting daemon");
                    crate::domain::spicetify::daemon::start_with(ctx, self.ports.daemon())
                }
                Some(DaemonAction::Enable) => {
                    self.ports.logger().info("Enabling daemon");
                    crate::domain::spicetify::daemon::enable_with(ctx, self.ports.config())
                }
                Some(DaemonAction::Disable) => {
                    self.ports.logger().info("Disabling daemon");
                    crate::domain::spicetify::daemon::disable_with(ctx, self.ports.config())
                }
                None => {
                    if ctx.daemon {
                        self.ports.logger().info("Starting daemon");
                        crate::domain::spicetify::daemon::start_with(ctx, self.ports.daemon())
                    } else {
                        Ok(())
                    }
                }
            },
            SpicetifyCommand::Dev => {
                crate::domain::spicetify::dev::run_with(ctx, self.ports.fs())?;
                self.ports.logger().info("Mode app-developer enabled");
                self.ports.spotify_process().restart_if_running(ctx)?;
                Ok(())
            }
            SpicetifyCommand::Fix => {
                crate::domain::spicetify::fix::run_with(ctx, self.ports.fs(), self.ports.logger())?;
                self.ports.logger().info("Restored Spotify to stock state");
                self.ports.spotify_process().restart_if_running(ctx)?;
                Ok(())
            }
            SpicetifyCommand::Init => {
                crate::domain::spicetify::init::run_with(ctx, self.ports.fs(), self.ports.config())?;
                self.ports.logger().info("Initialized spicetify");
                Ok(())
            }
            SpicetifyCommand::Pkg { action } => match action {
                PkgAction::Install { id, url } => {
                    crate::domain::spicetify::pkg::install_with(ctx, &id, &url, self.ports.fs())?;
                    self.ports.logger().info("Module added");
                    Ok(())
                }
                PkgAction::Delete { id } => {
                    crate::domain::spicetify::pkg::delete_with(ctx, &id)?;
                    self.ports.logger().info("Module deleted");
                    Ok(())
                }
                PkgAction::Enable { id } => {
                    crate::domain::spicetify::pkg::enable_with(ctx, &id)?;
                    self.ports.logger().info("Module enabled");
                    Ok(())
                }
            },
            SpicetifyCommand::Protocol { uri } => {
                crate::domain::spicetify::protocol::run_with(ctx, &uri, self.ports.uri_launcher())
            }
            SpicetifyCommand::Sync => {
                crate::domain::spicetify::sync::run_with(
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
                crate::domain::spotify::update::run_with(
                    ctx,
                    mode.as_str(),
                    self.ports.fs(),
                    self.ports.logger(),
                )?;
                self.ports
                    .logger()
                    .info("Patched the executable successfully");
                Ok(())
            }
        }
    }

    pub fn execute_spotify(&self, command: SpotifyCommand, ctx: &AppContext) -> Result<()> {
        match command {
            SpotifyCommand::Run { args } => {
                crate::domain::spotify::run::run_with(ctx, &args, self.ports.process())
            }
            SpotifyCommand::Update { mode } => {
                if matches!(mode, UpdateMode::Off) {
                    self.ports.spotify_process().stop(ctx)?;
                }
                crate::domain::spotify::update::run_with(
                    ctx,
                    mode.as_str(),
                    self.ports.fs(),
                    self.ports.logger(),
                )?;
                self.ports
                    .logger()
                    .info("Patched the executable successfully");
                Ok(())
            }
        }
    }
}
