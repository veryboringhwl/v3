import { ReduxStore } from "/modules/stdlib/src/expose/ReduxStore.ts";
import { logger, prefsClient, settingsClient, slotsClient, testingClient } from "../load.ts";
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
    logger.error("Failed inside `overrideSlot` function. Retrying in 1 second...\n", error);
    retryCounter(slotId, "increment");
    if (retryCounter(slotId, "get") > 5) {
      logger.error(
        `Failed inside \`overrideSlot\` function for 5th time. Giving up...\nSlot id: ${slotId}.`,
      );
      retryCounter(slotId, "clear");
      return;
    }
    setTimeout(overrideSlot, 1000, { slotId });
  }
};

export const slotSubscriptions: Array<{ cancel: () => void }> = [];
export const bindSlots = async (adSlots: { slotId: string }[]) => {
  for (const { slotId } of adSlots) {
    if (!slotsClient) return;
    await overrideSlot({ slotId });
    slotSubscriptions.push(
      slotsClient.subSlot({ slotId }, ({ adSlotEvent }) => overrideSlot(adSlotEvent)),
    );
  }
};

export let reduxStoreSubscription: () => void;
export let prefsSubscription: { cancel: () => void };
export const pauseAds = async () => {
  reduxStoreSubscription = ReduxStore.subscribe(() => {
    // disables: audio, billboard, inStreamApi, leaderboard, sponsoredPlaylist, and vto
    if (ReduxStore.getState().ads.root.adsEnabled === true) {
      ReduxStore.getState().ads.root.adsEnabled = false;
      ReduxStore.dispatch({ type: "ADS_DISABLED" });
      logger.log("Dispatched ADS_DISABLED");
    }
  });

  if (testingClient) {
    await testingClient.addPlaytime({ seconds: -100000000000 });
  }

  if (prefsClient) {
    const client = prefsClient;
    // triggered when hiding ad on home page
    await client.set({
      entries: { "ui.hide_hpto": { bool: true } },
    });

    prefsSubscription = prefsClient.sub({ key: "ui.hide_hpto" }, async ({ entries }) => {
      const current = entries["ui.hide_hpto"];
      if (current.bool === false) {
        await client.set({
          entries: { "ui.hide_hpto": { bool: true } },
        });
      }
    });
  }
};
