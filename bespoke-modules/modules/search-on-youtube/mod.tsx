import type { ModuleInstance } from "/hooks/module.ts";
import type { Settings } from "/modules/stdlib/lib/settings.tsx";
import { createSettings } from "/modules/stdlib/lib/settings.tsx";
import { createRegistrar } from "/modules/stdlib/mod.ts";

export let settings: Settings;

export default async function (mod: ModuleInstance) {
  const registrar = createRegistrar(mod);
  [settings] = createSettings(mod);

  const { SearchOnYoutubeMenuItem } = await import("./searchOnYoutube.tsx");

  registrar.register("menu", <SearchOnYoutubeMenuItem />);
}
