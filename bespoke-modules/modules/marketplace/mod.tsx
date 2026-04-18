import type { ModuleInstance } from "/hooks/module.ts";
import type { Settings } from "/modules/stdlib/lib/settings.tsx";
import { createSettings } from "/modules/stdlib/lib/settings.tsx";
import { createLogger, createRegistrar, createStorage } from "/modules/stdlib/mod.ts";
import { React } from "/modules/stdlib/src/expose/React.ts";
import { NavLink } from "/modules/stdlib/src/registers/navlink.tsx";
import panelReg from "/modules/stdlib/src/registers/panel.ts";
import { Route } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { ACTIVE_ICON, ICON } from "./src/static.ts";

export let storage: Storage;
export let logger: Console;
export let settings: Settings;
export let settingsButton: React.JSX.Element;

export let hash: { state: string; event: string } | undefined;

export let module: ModuleInstance;

export default async function (mod: ModuleInstance) {
  module = mod;
  storage = createStorage(mod);
  logger = createLogger(mod);
  [settings, settingsButton] = createSettings(mod);
  const registrar = createRegistrar(mod);

  const LazyApp = React.lazy(() => import("./src/app.tsx"));
  registrar.register("route", <Route element={<LazyApp />} path={"/bespoke/marketplace/*"} />);

  registrar.register("navlink", <MarketplaceLink />);

  const panel = React.createElement(
    (await import("./src/components/VersionList/index.tsx")).default,
  );
  registrar.register("panel", panel);
  hash = panelReg.getHash(panel)!;

  const { ModulesContextProvider } = await import("./src/components/ModulesProvider/index.tsx");
  registrar.register("rootProvider", <ModulesContextProvider />);
}

const MarketplaceLink = () => (
  <NavLink
    activeIcon={ACTIVE_ICON}
    appRoutePath="/bespoke/marketplace"
    icon={ICON}
    localizedApp="Marketplace"
  />
);
