use anyhow::Result;

use crate::application::service::ApplicationService;
use crate::core::app::AppContext;
use crate::core::cli::{SpicetifyCommand, SpotifyCommand};
use crate::infrastructure::system::SystemPorts;

pub fn dispatch_spicetify(command: SpicetifyCommand, ctx: &AppContext) -> Result<()> {
    ApplicationService::new(SystemPorts::default()).execute_spicetify(command, ctx)
}

pub fn dispatch_spotify(command: SpotifyCommand, ctx: &AppContext) -> Result<()> {
    ApplicationService::new(SystemPorts::default()).execute_spotify(command, ctx)
}
