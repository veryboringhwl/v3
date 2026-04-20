import { logger } from "../../mod.ts";

export interface SettingsClient {
  updateAdServerEndpoint(params: { slotIds: string[]; url: string }): Promise<void>;
  updateSlotEnabled(params: { slotId: string; enabled: boolean }): Promise<void>;
  updateDisplayTimeInterval(params: { slotId: string; timeInterval: bigint }): Promise<void>;
  updateStreamTimeInterval(params: { slotId: string; timeInterval: bigint }): Promise<void>;
}

export const getSettingsClient = (
  functionModules: any[],
  transport: any,
): SettingsClient | undefined => {
  try {
    const settings = functionModules.find(
      (m) => m.SERVICE_ID === "spotify.ads.esperanto.proto.Settings",
    );
    return new settings(transport);
  } catch (error) {
    logger.error("Failed to get settings client", error);
    return undefined;
  }
};

export interface SlotsClient {
  clearAllAds(params: { slotId: string }): Promise<void>;
  getSlots(): Promise<{ adSlots: { slotId: string }[] }>;
}

export const getSlotsClient = (functionModules: any[], transport: any): SlotsClient | undefined => {
  try {
    const slots = functionModules.find((m) => m.SERVICE_ID === "spotify.ads.esperanto.proto.Slots");
    return new slots(transport);
  } catch (error) {
    logger.error("Failed to get slots client", error);
    return undefined;
  }
};

export interface TestingClient {
  addPlaytime(params: { seconds: number }): Promise<void>;
}

export const getTestingClient = (
  functionModules: any[],
  transport: any,
): TestingClient | undefined => {
  try {
    const testing = functionModules.find(
      (m) => m.SERVICE_ID === "spotify.ads.esperanto.proto.Testing",
    );
    return new testing(transport);
  } catch (error) {
    logger.error("Failed to get testing client", error);
    return undefined;
  }
};
