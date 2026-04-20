import {
  adManagers,
  inStreamClient,
  logger,
  settingsClient,
  slotsClient,
  testingClient,
} from "../mod.ts";

import { retryCounter } from "./utils/counter.ts";

const overrideSlot = async ({ slotId }: { slotId: string }) => {
  try {
    if (slotsClient) {
      await slotsClient.clearAllAds({ slotId });
    }
    if (settingsClient) {
      // this one seems most important?
      await settingsClient.updateAdServerEndpoint({
        slotIds: [slotId],
        url: "http://localhost/no/thanks",
      });

      await settingsClient.updateSlotEnabled({ slotId, enabled: false });
      await settingsClient.updateStreamTimeInterval({ slotId, timeInterval: 0n });
      await settingsClient.updateDisplayTimeInterval({ slotId, timeInterval: 0n });
      await settingsClient.updateExpiryTimeInterval({ slotId, timeInterval: 0n });
    }
  } catch (error: unknown) {
    logger.error("Failed inside `handleAdSlot` function. Retrying in 1 second...\n", error);
    retryCounter(slotId, "increment");
    if (retryCounter(slotId, "get") > 5) {
      logger.error(
        `Failed inside \`handleAdSlot\` function for 5th time. Giving up...\nSlot id: ${slotId}.`,
      );
      retryCounter(slotId, "clear");
      return;
    }
    setTimeout(overrideSlot, 1000, { slotId });
  }
};

export const slotSubscriptions: Array<{ cancel: () => void }> = [];
export const bindSlots = (adSlots: { slotId: string }[]) => {
  for (const { slotId } of adSlots) {
    if (!slotsClient) return;
    slotSubscriptions.push(
      slotsClient.subSlot({ slotId }, ({ adSlotEvent }) => overrideSlot(adSlotEvent)),
    );
  }
};

export let inStreamSubscription: { cancel: () => void };
export const pauseAds = async () => {
  if (testingClient) {
    await testingClient.addPlaytime({ seconds: -100000000000 });
  }
  if (inStreamClient) {
    inStreamSubscription = inStreamClient.subInStream({}, ({ ad }) => {
      if (ad) {
        adManagers.inStreamApi.disable();
      }
    });
  }
  
  // idk if this even does anything
  // await adManagers.audio.disable();
  // await adManagers.billboard.disable();
  // await adManagers.leaderboard.disableLeaderboard();
  // await adManagers.sponsoredPlaylist.disable();
  // await adManagers.inStreamApi.disable();
  // await adManagers.vto.manager.disable();
  // adManagers.audio.isNewAdsNpvEnabled = false;
  // adManagers.vto.isNewAdsNpvEnabled = false;
};
