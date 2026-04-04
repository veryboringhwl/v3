use anyhow::Result;

use crate::app::AppContext;
use crate::infrastructure::ports::ProcessPort;

pub fn run_with(ctx: &AppContext, args: &[String], process: &dyn ProcessPort) -> Result<()> {
    let mut final_args = Vec::new();
    if ctx.mirror {
        final_args.push(format!(
            "--app-directory={}",
            ctx.config_path.join("apps").display()
        ));
    }
    final_args.extend(args.iter().cloned());

    process.spawn_program(&ctx.spotify_exec_path, &final_args)
}
