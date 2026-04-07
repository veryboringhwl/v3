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
  var __renderTopbarRightButtons: () => React.ReactNode;
}

globalThis.__renderTopbarRightButtons = () =>
  React.createElement(() => {
    [, refresh] = React.useReducer((n) => n + 1, 0);

    return <>{registry.all().reverse()}</>;
  });

transformer(
  (emit) => (str) => {
    emit();

    str = str.replace(
      /("login-button"[\s\S]*?![\w$]+\s*&&\s*\(0,[\w$]+\.jsxs\)\("div",\s*\{\s*className:\s*[\w$]+\(\)\([^)]+\),\s*children:\s*\[)/,
      "$1__renderTopbarRightButtons(),",
    );

    return str;
  },
  {
    glob: /^\/xpui-snapshot\.js/,
  },
);

type TopbarRightButtonProps = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  icon?: string;
};

export const TopbarRightButton: React.FC<TopbarRightButtonProps> = (props) => (
  <Tooltip label={props.label}>
    <UI.ButtonTertiary
      aria-label={props.label}
      className={MAP.main.topbar.right.button.wrapper}
      condensedAll
      disabled={props.disabled}
      onClick={props.onClick}
      size="small"
    >
      {props.icon &&
        createIconComponent({
          icon: props.icon,
        })}
    </UI.ButtonTertiary>
  </Tooltip>
);
