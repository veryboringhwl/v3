extern crate swc_core;

use std::convert::TryInto;
use swc_core::{
    ecma::{
        ast::Program,
        visit::VisitMutWith,
    },
    plugin::{plugin_transform, proxies::TransformPluginProgramMetadata},
};

#[plugin_transform]
pub fn process_transform(program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    let config = serde_json::from_str::<transform::config::PluginConfig>(
        &metadata
            .get_transform_plugin_config()
            .expect("failed to get plugin config"),
    )
    .expect("invalid config");
    let mut program = program;
    program.visit_mut_with(&mut transform::visitor::TransformVisitor {
        config,
    });
    program
}
