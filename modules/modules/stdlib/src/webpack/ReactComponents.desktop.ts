import { webpackRequire } from "../wpunpk.mix.ts";
import { analyzeWebpackRequire } from "./index.ts";

await (CHUNKS["/xpui-desktop-routes-settings.js"] ??= Promise.withResolvers()).promise;

const { exports } = analyzeWebpackRequire(webpackRequire);
export const Settings: {
  SettingsLabel: React.FC<{}>;
  SettingsRow: React.FC<{}>;
  SettingsRowEnd: React.FC<{}>;
  SettingsRowStart: React.FC<{}>;
} = exports.find((m) => m.SettingsRow);
