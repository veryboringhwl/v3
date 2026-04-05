import type { ModuleInstance } from "/hooks/module.ts";
import { createRegistrar } from "/modules/stdlib/mod.ts";
import { PlaybarButtonProbe } from "./src/diagnostics/registerHarness.tsx";
import { React } from "/modules/stdlib/src/expose/React.ts";
import { TestPanel } from "./src/panel/index.tsx";
import panelReg from "/modules/stdlib/src/registers/panel.ts";

export let module: ModuleInstance;
export let hash: { state: string; event: string } | undefined;

export default function (mod: ModuleInstance) {
  module = mod;
  const registrar = createRegistrar(mod);
  // registrar.register("topbarLeftButton", <TopbarLeftProbe />);
  // registrar.register("topbarRightButton", <TopbarRightProbe />);
  registrar.register("playbarButton", <PlaybarButtonProbe />);
  // registrar.register("playbarWidget", <PlaybarWidgetProbe />);
  // registrar.register("route", <Route path="/test/*" element={<AppLazy />} />);
  // registrar.register("navlink", <TestLink />);
  // registrar.register("menu", <RegisteredMenu />);
  // registrar.register("settingsSection", <SettingsSectionProbe />);

  const panel = React.createElement(TestPanel);
  registrar.register("panel", panel);
  hash = panelReg.getHash(panel)!;
}
