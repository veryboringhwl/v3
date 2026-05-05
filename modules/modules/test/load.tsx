import type { ModuleInstance } from "/hooks/module.ts";
import { createRegistrar } from "/modules/stdlib/mod.ts";
import { Platform } from "/modules/stdlib/src/expose/Platform.ts";
import { React } from "/modules/stdlib/src/expose/React.ts";
// import panelReg from "/modules/stdlib/src/registers/panel.ts";
import { Route } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import {
  TestMenu,
  TestNavLink,
  // TestPanel,
  TestPlaybarButton,
  TestPlaybarWidget,
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
  const LazyTestRoute = React.lazy(async () => {
    const { TestRoute } = await import("./registers/Route.tsx");
    return { default: TestRoute };
  });
  // use /spicetify/ to remove topbar but can still use normal if wanted
  registrar.register("route", <Route element={<LazyTestRoute />} path="/spicetify/test/*" />);
  registrar.register("navlink", <TestNavLink />);
  registrar.register("navlink", <TestNavLink />);
  registrar.register("navlink", <TestNavLink />);
  registrar.register("navlink", <TestNavLink />);
  registrar.register("menu", <TestMenu />);
  registrar.register("settingsSection", <TestSettingsSection />);
  // registrar.register("panel", <TestPanel />);
  // hash = panelReg.getHash(<TestPanel />)!;

  // cool experimental features ive found
  configureExpFeatures();
}

const configureExpFeatures = async () => {
  const overrides = {
    enableShareDialog: true,
    enableYlxMultiSelect: true,
  };

  const RemoteConfigDebugAPI = Platform.getRemoteConfigDebugAPI();
  for (const [key, value] of Object.entries(overrides)) {
    await RemoteConfigDebugAPI.setOverride({ source: "web", type: "boolean", name: key }, value);
  }
};
