import type { ModuleInstance } from "/hooks/module.ts";
import { createLogger } from "/modules/stdlib/mod.ts";
import { Platform } from "/modules/stdlib/src/expose/Platform.ts";
import { configureExpFeatures } from "./src/expFeatures.ts";
import { bindSlots, inStreamSubscription, pauseAds, slotSubscriptions } from "./src/slot.ts";
import type {
  InStreamClient,
  SettingsClient,
  SlotsClient,
  TestingClient,
} from "./src/utils/clients.ts";
import { getEsperantoClient } from "./src/utils/clients.ts";

export const localStorageApi = Platform.getLocalStorageAPI();
export const adManagers = Platform.getAdManagers();
export const productStateApi = Platform.getProductStateAPI().productStateApi;

const SETTINGS_SERVICE_ID = "spotify.ads.esperanto.proto.Settings";
const SLOTS_SERVICE_ID = "spotify.ads.esperanto.proto.Slots";
const TESTING_SERVICE_ID = "spotify.ads.esperanto.proto.Testing";
const INSTREAM_SERVICE_ID = "spotify.ads.esperanto.proto.InStream";

export const settingsClient = getEsperantoClient<SettingsClient>(SETTINGS_SERVICE_ID);
export const slotsClient = getEsperantoClient<SlotsClient>(SLOTS_SERVICE_ID);
export const testingClient = getEsperantoClient<TestingClient>(TESTING_SERVICE_ID);
export const inStreamClient = getEsperantoClient<InStreamClient>(INSTREAM_SERVICE_ID);

export let logger: Console;

export default async function (mod: ModuleInstance) {
  logger = createLogger(mod);

  let adSlots: { slotId: string }[] = [];
  if (slotsClient) adSlots = (await slotsClient.getSlots()).adSlots;

  configureExpFeatures();
  bindSlots(adSlots);
  pauseAds();

  logger.info("Loaded successfully");

  return async () => {
    logger.info("Unloaded successfully");
    for (const slotSubscription of slotSubscriptions) {
      slotSubscription.cancel();
    }
    inStreamSubscription.cancel();
  };
}
