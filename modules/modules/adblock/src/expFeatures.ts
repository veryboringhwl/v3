import { Platform } from "/modules/stdlib/src/expose/Platform.ts";

// "spotify.desktop.remote_config_esperanto.proto.DesktopRemoteConfig";
// if spotify ever removes RemoteConfigDebugAPI i can use this
// it is the same thing but lower level

export const configureExpFeatures = async () => {
  const overrides = {
    enableInAppMessaging: false,
    hideUpgradeCTA: true,
    enablePremiumUserForMiniPlayer: true,
    enableHpto: false,
    enableSponsoredPlaylistV2: false,
  };

  // localstorage doesnt update spotify instantly
  // so prefer the Platform API
  // localStorageApi.setItem("remote-config-overrides", overrides);

  const RemoteConfigDebugAPI = Platform.getRemoteConfigDebugAPI();

  for (const [key, value] of Object.entries(overrides)) {
    // This updates localstorage as well
    await RemoteConfigDebugAPI.setOverride({ source: "web", type: "boolean", name: key }, value);
  }
};
