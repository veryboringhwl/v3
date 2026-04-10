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
    str = str.replace(/("top-bar-forward-button"[^\]]*)/g, "$1,__renderTopbarLeftButtons()");
    emit();

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
  icon?: React.ReactNode;
  "data-testid"?: string;
};

export const TopbarLeftButton = ({
  label,
  disabled,
  onClick,
  icon,
  "data-testid": dataTestId,
}: TopbarLeftButtonProps) => {
  const IconComponent = React.useMemo(() => {
    return () => <>{icon}</>;
  }, [icon]);

  return (
    <Tooltip label={label}>
      <UI.ButtonTertiary
        aria-label={label}
        condensed
        data-testid={dataTestId}
        disabled={disabled}
        iconOnly={IconComponent}
        onClick={onClick}
        size="medium"
      ></UI.ButtonTertiary>
    </Tooltip>
  );
};
