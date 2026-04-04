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
    resolveIfExists("./target/wasm32-wasip1/release/swc_plugin_remapper.wasm") ??
    resolveIfExists("./target/wasm32-wasip1/release/swc_remapper.wasm") ??
    resolveIfExists("./target/wasm32-wasi/release/swc_plugin_remapper.wasm") ??
    resolveIfExists("./target/wasm32-wasi/release/swc_remapper.wasm");

  if (!resolved) {
    throw new Error("Local swc-plugin-remapper wasm not found. Run cargo build-wasi in modules/build/swc-plugin-remapper.");
  }

  return resolved;
}
