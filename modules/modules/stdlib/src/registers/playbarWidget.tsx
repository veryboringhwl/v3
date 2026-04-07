import { createIconComponent } from "../../lib/createIconComponent.tsx";
import { transformer } from "../../mixin.ts";
import type { React } from "../expose/React.ts";
import { UI } from "../webpack/ComponentLibrary.ts";
import { Tooltip } from "../webpack/ReactComponents.ts";
import { Registry } from "./registry.ts";

const registry = new Registry<React.ReactNode>();
export default registry;

declare global {
  var __renderNowPlayingBarWidgets: any;
}

globalThis.__renderNowPlayingBarWidgets = () => registry.all();
transformer(
  (emit) => (str) => {
    str = str.replace(/("hitRemoveLike".+?})\)\]/, "$1),...__renderNowPlayingBarWidgets()]");

    emit();
    return str;
  },
  {
    glob: /^\/dwp-now-playing-bar\.js/,
  },
);

export type PlaybarWidgetProps = {
  label: string;
  icon?: string;
  onClick: () => void;
};
export const PlaybarWidget = ({ label, icon, onClick }: PlaybarWidgetProps) => (
  <Tooltip label={label}>
    <UI.ButtonTertiary
      aria-label={label}
      className={undefined}
      condensed={false}
      iconOnly={icon && (() => createIconComponent({ icon }))}
      onClick={onClick}
      size="small"
    />
  </Tooltip>
);
