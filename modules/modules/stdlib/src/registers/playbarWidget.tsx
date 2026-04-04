import type { React } from "../expose/React.ts";
import { createIconComponent } from "../../lib/createIconComponent.tsx";
import { transformer } from "../../mixin.ts";
import { Tooltip } from "../webpack/ReactComponents.ts";
import { UI } from "../webpack/ComponentLibrary.ts";
import { Registry } from "./registry.ts";

const registry = new Registry<React.ReactNode>();
export default registry;

declare global {
  var __renderNowPlayingBarWidgets: any;
}

globalThis.__renderNowPlayingBarWidgets = () => registry.all();
transformer(
  (emit) => (str) => {
    emit();

    str = str.replace(
      /(desktop-npb-extra\.queueButton[\s\S]*?children:\s*\[)/,
      "$1...__renderNowPlayingBarWidgets(),",
    );

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
      size="small"
      className={undefined}
      aria-label={label}
      condensed={false}
      iconOnly={icon && (() => createIconComponent({ icon }))}
      onClick={onClick}
    />
  </Tooltip>
);
