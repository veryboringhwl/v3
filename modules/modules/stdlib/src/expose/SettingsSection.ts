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

export type SettingsSectionRowProps = {
  /**
   * The string used by the search functionality to filter and find this section.
   */
  filterMatchQuery?: string;
  children?: React.ReactNode;
};
export type SettingsSectionRow = React.FC<SettingsSectionRowProps>;
export let SettingsSectionRow: SettingsSectionRow;

export type SettingsSectionLabelProps = { children?: React.ReactNode };
export type SettingsSectionLabel = React.FC<SettingsSectionLabelProps>;
export let SettingsSectionLabel: SettingsSectionLabel;

export type SettingsSectionControlProps = { children?: React.ReactNode };
export type SettingsSectionControl = React.FC<SettingsSectionControlProps>;
export let SettingsSectionControl: SettingsSectionControl;

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

transformer<SettingsSectionRow>(
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
  SettingsSectionRow = $;
});

transformer<SettingsSectionLabel>(
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
  SettingsSectionLabel = $;
});

transformer<SettingsSectionControl>(
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
  SettingsSectionControl = $;
});
