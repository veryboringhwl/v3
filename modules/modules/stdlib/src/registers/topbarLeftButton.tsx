import { createIconComponent } from "../../lib/createIconComponent.tsx";
import { transformer } from "../../mixin.ts";
import { React } from "../expose/React.ts";
import { UI } from "../webpack/ComponentLibrary.ts";
import { Tooltip } from "../webpack/ReactComponents.ts";
import { Registry } from "./registry.ts";

const registry = new (class extends Registry<React.ReactNode> {
  override add(value: React.ReactNode): this {
    refresh?.();
    return super.add(value);
  }

  override delete(value: React.ReactNode): boolean {
    refresh?.();
    return super.delete(value);
  }
})();
export default registry;

let refresh: React.DispatchWithoutAction | undefined;

declare global {
  var __renderTopbarLeftButtons: any;
}

globalThis.__renderTopbarLeftButtons = () =>
  React.createElement(() => {
    [, refresh] = React.useReducer((n) => n + 1, 0);
    return <>{registry.all()}</>;
  });

transformer(
  (emit) => (str) => {
    emit();
    str = str.replace(/("top-bar-forward-button"[^\]]*)/g, "$1,__renderTopbarLeftButtons()");
    return str;
  },
  {
    glob: /^\/xpui-snapshot\.js/,
  },
);

type TopbarLeftButtonProps = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  icon?: string;
};

export const TopbarLeftButton = (props: TopbarLeftButtonProps) => (
  <Tooltip label={props.label}>
    <UI.ButtonTertiary
      aria-label={props.label}
      className={MAP.main.topbar.left.button.wrapper}
      condensed
      disabled={props.disabled}
      iconOnly={() =>
        props.icon &&
        createIconComponent({
          icon: props.icon,
          iconSize: 16,
          realIconSize: 24,
        })
      }
      onClick={props.onClick}
      size="medium"
    />
  </Tooltip>
);
