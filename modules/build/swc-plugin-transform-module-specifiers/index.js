function resolveIfExists(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  try {
    Deno.statSync(url);
    return url.href;
  } catch {
    return null;
  }
}

export default function () {
  const resolved =
    resolveIfExists("./target/wasm32-wasip1/release/swc_plugin_transform_module_specifiers.wasm") ??
    resolveIfExists("./target/wasm32-wasi/release/swc_plugin_transform_module_specifiers.wasm");

  if (!resolved) {
    throw new Error(
      "Local swc-plugin-transform-module-specifiers wasm not found. Run cargo build-wasi in modules/build/swc-plugin-transform-module-specifiers.",
    );
  }

  return resolved;
}
