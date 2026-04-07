import type { ModuleInstance } from "/hooks/module.ts";
import { createRegistrar } from "/modules/stdlib/mod.ts";
import { Route } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import {
  AppLazy,
  PlaybarButtonProbe,
  PlaybarWidgetProbe,
  RegisteredMenu,
  SettingsSectionProbe,
  TestLink,
  TopbarLeftProbe,
  TopbarRightProbe,
} from "./src/diagnostics/registerHarness.tsx";

export let module: ModuleInstance;
export let hash: { state: string; event: string } | undefined;

export default function (mod: ModuleInstance) {
  module = mod;
  const registrar = createRegistrar(mod);
  registrar.register("topbarLeftButton", <TopbarLeftProbe />);
  registrar.register("topbarRightButton", <TopbarRightProbe />);
  registrar.register("playbarButton", <PlaybarButtonProbe />);
  registrar.register("playbarWidget", <PlaybarWidgetProbe />);
  registrar.register("route", <Route element={<AppLazy />} path="/test/*" />);
  registrar.register("navlink", <TestLink />);
  registrar.register("menu", <RegisteredMenu />);
  registrar.register("settingsSection", <SettingsSectionProbe />);

  // const panel = React.createElement(TestPanel);
  // registrar.register("panel", panel);
  // hash = panelReg.getHash(panel)!;
}
