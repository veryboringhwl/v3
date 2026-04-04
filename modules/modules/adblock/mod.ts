import { Platform } from "/modules/stdlib/src/expose/Platform.ts";
import { exportedFunctions } from "/modules/stdlib/src/webpack/index.js";
import { getSettingsClient, getSlotsClient, getTestingClient } from "./src/utils/clients.ts";
import type { SettingsClient, SlotsClient, TestingClient } from "./src/interfaces/webpack.ts";
import { configureAdManagers } from "./src/slot.ts";
import { createLogger } from "/modules/stdlib/mod.ts";
import type { ModuleInstance } from "/hooks/module.ts";
import { configureExpFeatures } from "./src/expFeatures.ts";

const { getAdManagers, getLocalStorageAPI, getEsperantoTransport } = Platform;

export const localStorage = getLocalStorageAPI();
export const adManagers = getAdManagers();
export const productState = Platform?.getProductStateAPI().productStateApi;
export const settingsClient: SettingsClient | undefined = getSettingsClient(
  exportedFunctions,
  getEsperantoTransport(),
);
export const slotsClient: SlotsClient | undefined = getSlotsClient(
  exportedFunctions,
  getEsperantoTransport(),
);
export const testingClient: TestingClient | undefined = getTestingClient(
  exportedFunctions,
  getEsperantoTransport(),
);

export let logger: Console;

export default async function (mod: ModuleInstance) {
  logger = createLogger(mod);

  configureExpFeatures();
  await productState.subValues({ keys: ["ads", "catalogue", "product", "type"] }, () =>
    configureAdManagers(),
  );

  logger.info("Loaded successfully");
}
