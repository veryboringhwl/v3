import type { SettingsClient, SlotsClient, TestingClient } from "../interfaces/webpack.ts";

export const getSettingsClient = (
  functionModules: any[],
  transport: any,
): SettingsClient | undefined => {
  try {
    const slots = functionModules.find((m) => m.SERVICE_ID === "spotify.ads.esperanto.proto.Slots");
    return new slots(transport);
  } catch (error) {
    console.error("Failed to get ads settings client", error);
    return undefined;
  }
};

export const getSlotsClient = (functionModules: any[], transport: any): SlotsClient | undefined => {
  try {
    const slots = functionModules.find((m) => m.SERVICE_ID === "spotify.ads.esperanto.proto.Slots");
    return new slots(transport);
  } catch (error) {
    console.error("Failed to get slots client", error);
    return undefined;
  }
};

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
    console.error("adblockify: Failed to get testing client", error);
    return undefined;
  }
};
