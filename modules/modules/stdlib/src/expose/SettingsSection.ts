import { transformer } from "../../mixin.ts";

export const future = {
  push: () => {},
  pull(fn: () => void) {
    const push = this.push;
    this.push = () => {
      push();
      fn();
    };
  },
};
export type SettingsSectionProps = {
  /**
   * The string used by the search functionality to filter and find this section.
   */
  filterMatchQuery?: string;
  children?: React.ReactNode;
};
export type SettingsSection = React.FC<SettingsSectionProps>;
export let SettingsSection: SettingsSection;

export type SettingsRowProps = {
  /**
   * The string used by the search functionality to filter and find this section.
   */
  filterMatchQuery?: string;
  children?: React.ReactNode;
};
export type SettingsRow = React.FC<SettingsRowProps>;
export let SettingsRow: SettingsRow;

export type SettingsRowStartProps = { children?: React.ReactNode };
export type SettingsRowStart = React.FC<SettingsRowStartProps>;
export let SettingsRowStart: SettingsRowStart;

export type SettingsRowEndProps = { children?: React.ReactNode };
export type SettingsRowEnd = React.FC<SettingsRowEndProps>;
export let SettingsRowEnd: SettingsRowEnd;

transformer<SettingsSection>(
  (emit) => (str) => {
    str = str.replace(
      /(\.jsxs\)\()([a-zA-Z_$][\w$]*)([^=]*"desktop.settings.compatibility")/,
      "$1(__SettingsSection=$2)$3",
    );
    Object.defineProperty(globalThis, "__SettingsSection", { set: emit });
    return str;
  },
  {
    glob: /^\/xpui-routes-desktop-settings\.js/,
    wait: false,
  },
).then(($) => {
  SettingsSection = $;
  future.push();
});

transformer<SettingsRow>(
  (emit) => (str) => {
    str = str.replace(
      /(\.jsxs\)\()([a-zA-Z_$][\w$]*)([^=]*"desktop.settings.enableHardwareAcceleration")/,
      "$1(__SettingsSectionRow=$2)$3",
    );
    Object.defineProperty(globalThis, "__SettingsSectionRow", {
      set: emit,
    });
    return str;
  },
  {
    glob: /^\/xpui-routes-desktop-settings\.js/,
    wait: false,
  },
).then(($) => {
  SettingsRow = $;
});

transformer<SettingsRowStart>(
  (emit) => (str) => {
    str = str.replace(
      /(\(\d+,\s*[a-zA-Z_$][\w$]*\.jsx\)\()([a-zA-Z_$][\w$]*)(\s*,\s*\{\s*children:\s*\(\d+,\s*[a-zA-Z_$][\w$]*\.jsx\)\([a-zA-Z_$][\w$.]*\s*,\s*\{\s*htmlFor:\s*"desktop\.settings\.enableHardwareAcceleration")/,
      "$1(__SettingsSectionLabel=$2)$3",
    );
    Object.defineProperty(globalThis, "__SettingsSectionLabel", { set: emit });
    return str;
  },
  {
    glob: /^\/xpui-routes-desktop-settings\.js/,
    wait: false,
  },
).then(($) => {
  SettingsRowStart = $;
});

transformer<SettingsRowEnd>(
  (emit) => (str) => {
    str = str.replace(
      /(\(\d+,\s*[a-zA-Z_$][\w$]*\.jsx\)\()([a-zA-Z_$][\w$]*)(\s*,\s*\{\s*children:\s*\(\d+,\s*[a-zA-Z_$][\w$]*\.jsx\)\([a-zA-Z_$][\w$.]*\s*,\s*\{\s*id:\s*"desktop\.settings\.enableHardwareAcceleration")/,
      "$1(__SettingsSectionControl=$2)$3",
    );
    Object.defineProperty(globalThis, "__SettingsSectionControl", {
      set: emit,
    });
    return str;
  },
  {
    glob: /^\/xpui-routes-desktop-settings\.js/,
    wait: false,
  },
).then(($) => {
  SettingsRowEnd = $;
});
