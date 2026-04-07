import { createIconComponent } from "../../lib/createIconComponent.tsx";
import { transformer } from "../../mixin.ts";
import type { React } from "../expose/React.ts";
import { classnames } from "../webpack/ClassNames.ts";
import { UI } from "../webpack/ComponentLibrary.ts";
import { Tooltip } from "../webpack/ReactComponents.ts";
import { Registry } from "./registry.ts";

const registry = new Registry<React.ReactNode>();
export default registry;

declare global {
  var __renderNowPlayingBarButtons: any;
}

globalThis.__renderNowPlayingBarButtons = () => registry.all().reverse();
transformer(
  (emit) => (str) => {
    str = str.replace(
      /(desktop-npb-extra\.queueButton[\s\S]*?children:\s*\[)/,
      "$1...__renderNowPlayingBarWidgets(),",
    );

    emit();
    return str;
  },
  {
    glob: /^\/dwp-now-playing-bar\.js/,
  },
);

export type PlaybarButtonProps = {
  label: string;
  isActive?: boolean;
  isActiveNoIndicator?: boolean;
  disabled?: boolean;
  icon?: string;
  onClick: () => void;
};
export const PlaybarButton = ({
  label,
  isActive = false,
  isActiveNoIndicator = false,
  disabled = false,
  icon,
  onClick,
}: PlaybarButtonProps) => (
  <Tooltip label={label}>
    <UI.ButtonTertiary
      aria-label={label}
      aria-pressed={isActive}
      className={classnames(MAP.main.playbar.buttons.button.wrapper, {
        [MAP.main.playbar.buttons.button.wrapper__indicator]: isActive,
        [MAP.main.playbar.buttons.button.wrapper__active]: isActive || isActiveNoIndicator,
      })}
      data-active={isActive.toString()}
      disabled={disabled}
      iconOnly={icon && (() => createIconComponent({ icon }))}
      onClick={onClick}
      size="small"
    />
  </Tooltip>
);
