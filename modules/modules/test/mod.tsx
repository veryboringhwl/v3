import type { ModuleInstance } from "/hooks/module.ts";
import { createRegistrar } from "/modules/stdlib/mod.ts";
// import { panelReg } from "/modules/stdlib/src/registers/panel.ts";
import { Route } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import {
  TestMenu,
  TestNavLink,
  TestPlaybarButton,
  TestPlaybarWidget,
  TestRoute,
  TestSettingsSection,
  TestTopbarLeftButton,
  TestTopbarRightButton,
} from "./registers/index.ts";

export let module: ModuleInstance;
export let hash: { state: string; event: string } | undefined;

export default function (mod: ModuleInstance) {
  module = mod;
  const registrar = createRegistrar(mod);
  registrar.register("topbarLeftButton", <TestTopbarLeftButton />);
  registrar.register("topbarRightButton", <TestTopbarRightButton />);
  registrar.register("playbarButton", <TestPlaybarButton />);
  registrar.register("playbarWidget", <TestPlaybarWidget />);
  registrar.register("route", <Route element={<TestRoute />} path="/test/*" />);
  registrar.register("navlink", <TestNavLink />);
  registrar.register("menu", <TestMenu />);
  registrar.register("settingsSection", <TestSettingsSection />);

  // registrar.register("panel", <TestPanel />);
  // hash = panelReg.getHash(<TestPanel />)!;
}
