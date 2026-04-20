import { adManagers, logger, settingsClient, slotsClient, testingClient } from "../mod.ts";
import { retryCounter } from "./utils/counter.ts";

export const bindSlots = (slots: { slotId: string }[]) => {
  for (const slot of slots) {
    subToSlot(slot.slotId);
    setTimeout(() => handleAdSlot({ adSlotEvent: { slotId: slot.slotId } }), 50);
  }
};

export const subToSlot = (slotId: string) => {
  try {
    adManagers.audio.inStreamApi.adsCoreConnector.subscribeToSlot(slotId, handleAdSlot);
  } catch (error: unknown) {
    logger.error("Failed inside `subToSlot` function\n", error);
  }
};

const handleAdSlot = async (data: { adSlotEvent: { slotId: string } }) => {
  const slotId = data?.adSlotEvent?.slotId;

  try {
    adManagers.audio.inStreamApi.adsCoreConnector.clearSlot(slotId, undefined);
    if (!settingsClient || !slotsClient) return;

    await slotsClient.clearAllAds({ slotId });
    await settingsClient.updateSlotEnabled({ slotId, enabled: false });
    await settingsClient.updateAdServerEndpoint({
      slotIds: [slotId],
      url: "http://localhost/no/thanks",
    });
    await settingsClient.updateStreamTimeInterval({
      slotId,
      timeInterval: 0n,
    });
    await settingsClient.updateDisplayTimeInterval({
      slotId,
      timeInterval: 0n,
    });
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
    setTimeout(handleAdSlot, 1000, data);
  }
  configureAdManagers();
};

export const configureAdManagers = async () => {
  try {
    if (!testingClient) return;

    await testingClient.addPlaytime({ seconds: -100000000000 });

    await adManagers.audio.disable();
    await adManagers.billboard.disable();
    await adManagers.leaderboard.disableLeaderboard();
    await adManagers.sponsoredPlaylist.disable();
    await adManagers.inStreamApi.disable();
    await adManagers.vto.manager.disable();
    adManagers.audio.isNewAdsNpvEnabled = false;
    adManagers.vto.isNewAdsNpvEnabled = false;
  } catch (error: unknown) {
    logger.error("Failed inside `configureAdManagers` function\n", error);
  }
};
