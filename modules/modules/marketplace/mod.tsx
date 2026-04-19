import type { ModuleInstance } from "/hooks/module.ts";
import { createLogger, createRegistrar, createStorage } from "/modules/stdlib/mod.ts";
import { React } from "/modules/stdlib/src/expose/React.ts";
import { Route } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { MarketplaceNavLink } from "./src/shared/components/MarketplaceNavLink.tsx";

export let storage: Storage;
export let logger: Console;

export let module: ModuleInstance;

export default async function (mod: ModuleInstance) {
  module = mod;
  storage = createStorage(mod);
  logger = createLogger(mod);
  const registrar = createRegistrar(mod);

  const LazyApp = React.lazy(() => import("./src/app/MarketplaceApp.tsx"));
  registrar.register("route", <Route element={<LazyApp />} path={"/bespoke/marketplace/*"} />);

  registrar.register("navlink", <MarketplaceNavLink />);
  const { MarketplaceSettingsSection } = await import(
    "./src/shared/components/MarketplaceSettingsSection.tsx"
  );
  registrar.register("settingsSection", <MarketplaceSettingsSection />);
}
