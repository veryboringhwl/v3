import type { ModuleInstance } from "/hooks/module.ts";
import { createLogger } from "/modules/stdlib/mod.ts";
import { configureExpFeatures } from "./src/expFeatures.ts";
import {
  bindSlots,
  pauseAds,
  prefsSubscription,
  reduxStoreSubscription,
  slotSubscriptions,
} from "./src/slot.ts";
import type {
  PrefsClient,
  SettingsClient,
  SlotsClient,
  TestingClient,
} from "./src/utils/clients.ts";
import { getEsperantoClient } from "./src/utils/clients.ts";

const SETTINGS_SERVICE_ID = "spotify.ads.esperanto.proto.Settings";
const SLOTS_SERVICE_ID = "spotify.ads.esperanto.proto.Slots";
const TESTING_SERVICE_ID = "spotify.ads.esperanto.proto.Testing";
const PREFS_SERVICE_ID = "spotify.prefs.esperanto.proto.Prefs";

export const settingsClient = getEsperantoClient<SettingsClient>(SETTINGS_SERVICE_ID);
export const slotsClient = getEsperantoClient<SlotsClient>(SLOTS_SERVICE_ID);
export const testingClient = getEsperantoClient<TestingClient>(TESTING_SERVICE_ID);
export const prefsClient = getEsperantoClient<PrefsClient>(PREFS_SERVICE_ID);
export let logger: Console;

export default async function (mod: ModuleInstance) {
  logger = createLogger(mod);

  let adSlots: { slotId: string }[] = [];
  if (slotsClient) adSlots = (await slotsClient.getSlots()).adSlots;
  bindSlots(adSlots);
  pauseAds();
  configureExpFeatures();

  logger.info("Loaded successfully");

  return async () => {
    logger.info("Unloaded successfully");
    for (const slotSubscription of slotSubscriptions) {
      slotSubscription.cancel();
    }
    reduxStoreSubscription();
    prefsSubscription.cancel();
  };
}
