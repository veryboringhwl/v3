use anyhow::Result;

use crate::app::AppContext;
use crate::cli::{SpicetifyCommand, SpotifyCommand};
use crate::infrastructure::system::SystemPorts;

pub fn dispatch_spicetify(command: SpicetifyCommand, ctx: &AppContext) -> Result<()> {
    crate::application::service::ApplicationService::new(SystemPorts::default())
        .execute_spicetify(command, ctx)
}

pub fn dispatch_spotify(command: SpotifyCommand, ctx: &AppContext) -> Result<()> {
    crate::application::service::ApplicationService::new(SystemPorts::default())
        .execute_spotify(command, ctx)
}
