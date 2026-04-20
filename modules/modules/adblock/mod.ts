import type { ModuleInstance } from "/hooks/module.ts";
import { createLogger } from "/modules/stdlib/mod.ts";
import { Platform } from "/modules/stdlib/src/expose/Platform.ts";
import { exportedFunctions } from "/modules/stdlib/src/webpack/index.js";
import { configureExpFeatures } from "./src/expFeatures.ts";
import { bindSlots, configureAdManagers } from "./src/slot.ts";
import type { SettingsClient, SlotsClient, TestingClient } from "./src/utils/clients.ts";
import { getSettingsClient, getSlotsClient, getTestingClient } from "./src/utils/clients.ts";

export const localStorageApi = Platform.getLocalStorageAPI();
export const adManagers = Platform.getAdManagers();
export const productStateApi = Platform.getProductStateAPI().productStateApi;
export const EsperantoTransport = Platform.getEsperantoTransport();

export const settingsClient: SettingsClient | undefined = getSettingsClient(
  exportedFunctions,
  EsperantoTransport,
);
export const slotsClient: SlotsClient | undefined = getSlotsClient(
  exportedFunctions,
  EsperantoTransport,
);
export const testingClient: TestingClient | undefined = getTestingClient(
  exportedFunctions,
  EsperantoTransport,
);

export let logger: Console;

export default async function (mod: ModuleInstance) {
  logger = createLogger(mod);

  let slots: { slotId: string }[] = [];
  if (slotsClient) slots = (await slotsClient.getSlots()).adSlots;

  configureExpFeatures();
  bindSlots(slots);
  await productStateApi.subValues({ keys: ["ads", "catalogue", "product", "type"] }, () =>
    configureAdManagers(),
  );

  logger.info("Loaded successfully");
}
