import { React } from "../expose/React.ts";
import { createIconComponent } from "../../lib/createIconComponent.tsx";
import { transformer } from "../../mixin.ts";
import { Platform } from "../expose/Platform.ts";
import { classnames } from "../webpack/ClassNames.ts";
import { Tooltip } from "../webpack/ReactComponents.ts";
import { UI } from "../webpack/ComponentLibrary.ts";
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
      <>
        {registry.all()}
        {/*<ScrollableContainer
          className="custom-navlinks-scrollable_container"
          onlyHorizontalWheel
        >
          {registry.all()}
        </ScrollableContainer>*/}
      </>
    );
  });
transformer(
  (emit) => (str) => {
    emit();

    str = str.replace(
      /("data-testid":\s*"global-nav-bar"[\s\S]*?children:\s*\[\s*)(\(\s*0,\s*[a-zA-Z_$][\w$]*\.jsx\)\s*\(\s*[^,]+,\s*\{\s*className:\s*[^}]+\}\s*\)\s*,)/,
      "$1__renderNavLinks(), $2",
    );

    return str;
  },
  {
    glob: /^\/xpui-snapshot\.js/,
  },
);
transformer(
  (emit) => (str) => {
    emit();

    str = str.replace('["","/","/home/",', '["","/","/home/","/bespoke/*",');

    return str;
  },
  {
    glob: /^\/dwp-top-bar\.js/,
  },
);

export type NavLinkProps = {
  localizedApp: string;
  appRoutePath: string;
  icon: string;
  activeIcon: string;
};
export const NavLink: React.FC<NavLinkProps> = (props) => {
  const isActive = Platform.getHistory().location.pathname?.startsWith(props.appRoutePath);
  const createIcon = () =>
    createIconComponent({
      icon: isActive ? props.activeIcon : props.icon,
      iconSize: 24,
    });

  return (
    <_NavLink
      localizedApp={props.localizedApp}
      appRoutePath={props.appRoutePath}
      createIcon={createIcon}
      isActive={isActive}
    />
  );
};

interface NavLinkFactoryProps {
  localizedApp: string;
  appRoutePath: string;
  createIcon: () => React.ReactNode;
  isActive: boolean;
}

const _NavLink: React.FC<NavLinkFactoryProps> = (props) => {
  return (
    <Tooltip label={props.localizedApp}>
      <UI.ButtonTertiary
        iconOnly={props.createIcon}
        className={classnames("_Bg_zSvFrEutyacG kUHE42xvQVzWqabl uBpmNFia37U4nzmX", {
          kxv3By32Og8yDEXy: props.isActive,
        })}
        aria-label={props.localizedApp}
        onClick={() => Platform.getHistory().push(props.appRoutePath)}
      />
    </Tooltip>
  );
};
