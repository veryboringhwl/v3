import type { React } from "../expose/React.ts";
import { createIconComponent } from "../../lib/createIconComponent.tsx";
import { transformer } from "../../mixin.ts";
import { Tooltip } from "../webpack/ReactComponents.ts";
import { UI } from "../webpack/ComponentLibrary.ts";
import { classnames } from "../webpack/ClassNames.ts";
import { Registry } from "./registry.ts";

const registry = new Registry<React.ReactNode>();
export default registry;

declare global {
  var __renderNowPlayingBarButtons: any;
}

globalThis.__renderNowPlayingBarButtons = () => registry.all().reverse();
transformer(
  (emit) => (str) => {
    emit();

    str = str.replace(
      /(children\s*:\s*\[\s*)(?=(?:(?!children\s*:\s*\[)[\s\S])*?djJumpButtonFactory)/,
      "$1...__renderNowPlayingBarButtons(),",
    );

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
      size="small"
      className={classnames(MAP.main.playbar.buttons.button.wrapper, {
        [MAP.main.playbar.buttons.button.wrapper__indicator]: isActive,
        [MAP.main.playbar.buttons.button.wrapper__active]: isActive || isActiveNoIndicator,
      })}
      disabled={disabled}
      iconOnly={icon && (() => createIconComponent({ icon }))}
      onClick={onClick}
      data-active={isActive.toString()}
      aria-pressed={isActive}
    />
  </Tooltip>
);
