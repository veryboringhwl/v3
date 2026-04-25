import { transformer } from "../../mixin.ts";
import { Platform } from "../expose/Platform.ts";
import { React } from "../expose/React.ts";
import { classnames } from "../webpack/ClassNames.ts";
import { UI } from "../webpack/ComponentLibrary.ts";
import { ScrollableContainer, Tooltip } from "../webpack/ReactComponents.ts";
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
  var __renderNavLinks: () => React.ReactNode;
}

globalThis.__renderNavLinks = () =>
  React.createElement(() => {
    [, refresh] = React.useReducer((n) => n + 1, 0);

    return (
      <ScrollableContainer className="navlinks-scrollable_container" onlyHorizontalWheel>
        {registry.all()}
      </ScrollableContainer>
    );
  });

transformer(
  (emit) => (str) => {
    str = str.replace(
      /("spotify:app:home"[\s\S]*?,[a-zA-Z_$][\w$]*=\(\{children:([a-zA-Z_$][\w$]*)\}\)=>[^}]*?,children:)\2/,
      "$1[$2,__renderNavLinks()]",
    );

    emit();
    return str;
  },
  {
    glob: /^\/xpui-snapshot\.js/,
  },
);

export type NavLinkProps = {
  localizedApp: string;
  appRoutePath: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
};

export const NavLink: React.FC<NavLinkProps> = (props) => {
  const isActive = Platform.getHistory().location.pathname?.startsWith(props.appRoutePath);

  return (
    <_NavLink
      appRoutePath={props.appRoutePath}
      icon={isActive ? props.activeIcon : props.icon}
      isActive={isActive}
      localizedApp={props.localizedApp}
    />
  );
};

interface NavLinkFactoryProps {
  localizedApp: string;
  appRoutePath: string;
  icon: React.ReactNode;
  isActive: boolean;
}

const _NavLink: React.FC<NavLinkFactoryProps> = ({
  localizedApp,
  appRoutePath,
  icon,
  isActive,
}: NavLinkFactoryProps) => {
  const IconComponent = React.useMemo(() => {
    return () => <>{icon}</>;
  }, [icon]);

  return (
    <Tooltip label={localizedApp}>
      <UI.ButtonTertiary
        aria-label={localizedApp}
        className={classnames("_Bg_zSvFrEutyacG kUHE42xvQVzWqabl uBpmNFia37U4nzmX", {
          kxv3By32Og8yDEXy: isActive,
        })}
        iconOnly={IconComponent}
        onClick={() => {
          Platform.getHistory().push(appRoutePath);
        }}
        size="medium"
      ></UI.ButtonTertiary>
    </Tooltip>
  );
};
