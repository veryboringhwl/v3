import { Platform } from "/modules/stdlib/src/expose/Platform.ts";
import { localStorageApi } from "../load.ts";

export const configureExpFeatures = async () => {
  const expFeatures = localStorageApi.getItem("remote-config-overrides");
  if (!expFeatures) return;

  const overrides = {
    ...expFeatures,
    enableInAppMessaging: true,
    hideUpgradeCTA: true,
    enablePremiumUserForMiniPlayer: true,
  };
  localStorageApi.setItem("remote-config-overrides", overrides);
  const RemoteConfigDebugAPI = Platform.getRemoteConfigDebugAPI();

  for (const [key, value] of Object.entries(overrides)) {
    await RemoteConfigDebugAPI.setOverride({ source: "web", type: "boolean", name: key }, value);
  }
};
