import { Platform } from "/modules/stdlib/src/expose/Platform.ts";
import { exportedFunctions } from "/modules/stdlib/src/webpack/index.js";
import { logger } from "../../mod.ts";

export const EsperantoTransport = Platform.getEsperantoTransport();

export interface SettingsClient {
  updateAdServerEndpoint(params: { slotIds: string[]; url: string }): Promise<void>;
  updateSlotEnabled(params: { slotId: string; enabled: boolean }): Promise<void>;
  updateDisplayTimeInterval(params: { slotId: string; timeInterval: bigint }): Promise<void>;
  updateStreamTimeInterval(params: { slotId: string; timeInterval: bigint }): Promise<void>;
  updateExpiryTimeInterval(params: { slotId: string; timeInterval: bigint }): Promise<void>;
}

export interface SlotsClient {
  subSlot(params: { slotId: string }, callback: (data: any) => void): { cancel: () => void };
  clearAllAds(params: { slotId: string }): Promise<void>;
  getSlots(): Promise<{ adSlots: { slotId: string }[] }>;
}

export interface TestingClient {
  addPlaytime(params: { seconds: number }): Promise<void>;
}

export interface InStreamClient {
  subInStream(params: { request: {} }, callback: (data: any) => void): { cancel: () => void };
}

export function getEsperantoClient<T>(serviceId: string): T | undefined {
  try {
    const Client = exportedFunctions.find((m: any) => m.SERVICE_ID === serviceId);

    if (!Client) {
      logger.error(`No Esperanto client found for: ${serviceId}`);
      return undefined;
    }

    return new Client(EsperantoTransport) as T;
  } catch (error) {
    logger.error(`Failed to create Esperanto client: ${serviceId}`, error);
    return undefined;
  }
}
