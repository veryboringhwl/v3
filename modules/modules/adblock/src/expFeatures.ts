import { localStorage } from "../mod.ts";

export const configureExpFeatures = () => {
  const expFeatures = localStorage.getItem<{ [key: string]: unknown }>("remote-config-overrides");
  if (!expFeatures) return;

  const overrides = {
    ...expFeatures,
    enableEsperantoMigration: true,
    enableInAppMessaging: false,
    hideUpgradeCTA: true,
  };
  localStorage.setItem("remote-config-overrides", overrides);
};
