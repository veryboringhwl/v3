import type { ModuleInstance } from "/hooks/module.ts";
import { registerStdlibDiagnostics } from "./src/diagnostics/registerHarness.tsx";

export let module: ModuleInstance;

export default function (mod: ModuleInstance) {
  module = mod;
  registerStdlibDiagnostics(mod);
}
