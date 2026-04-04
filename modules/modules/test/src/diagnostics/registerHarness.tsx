import type { ModuleInstance } from "/hooks/module.ts";
import { display } from "/modules/stdlib/lib/modal.tsx";
import { createRegistrar } from "/modules/stdlib/mod.ts";
import { React } from "/modules/stdlib/src/expose/React.ts";
import {
  SettingsSection,
  SettingsSectionTitle,
  future as settingsSectionFuture,
} from "/modules/stdlib/src/expose/SettingsSection.ts";
import { NavLink } from "/modules/stdlib/src/registers/navlink.tsx";
import { PlaybarButton } from "/modules/stdlib/src/registers/playbarButton.tsx";
import { PlaybarWidget } from "/modules/stdlib/src/registers/playbarWidget.tsx";
import { TopbarLeftButton } from "/modules/stdlib/src/registers/topbarLeftButton.tsx";
import { TopbarRightButton } from "/modules/stdlib/src/registers/topbarRightButton.tsx";
import { MenuItem, MenuItemSubMenu, Route } from "/modules/stdlib/src/webpack/ReactComponents.ts";

import { ACTIVE_ICON, ICON } from "../static.ts";

type SettingsSectionWithChildren = React.FC<{
  filterMatchQuery: string;
  children?: React.ReactNode;
}>;

type SettingsSectionTitleWithChildren = React.FC<{
  children?: React.ReactNode;
}>;

const ICON_PATH =
  '<path d="M11.472.279L2.583 10.686l-.887 4.786 4.588-1.625L15.173 3.44 11.472.279zM5.698 12.995l-2.703.957.523-2.819v-.001l2.18 1.863zm-1.53-2.623l7.416-8.683 2.18 1.862-7.415 8.683-2.181-1.862z"/>';

const AppLazy = React.lazy(() => import("../app.tsx"));

const openDiagnosticsModal = async () => {
  const { DiagnosticsModal } = await import("./DiagnosticsModal.tsx");

  display({
    title: "Stdlib diagnostics",
    content: <DiagnosticsModal />,
    isLarge: true,
  });
};

const registerButtonProps = {
  label: "test-button",
  icon: ICON_PATH,
  onClick: openDiagnosticsModal,
};

const TopbarLeftProbe = () => <TopbarLeftButton {...registerButtonProps} />;

const TopbarRightProbe = () => <TopbarRightButton {...registerButtonProps} />;

const PlaybarButtonProbe = () => <PlaybarButton {...registerButtonProps} />;

const PlaybarWidgetProbe = () => <PlaybarWidget {...registerButtonProps} />;

const TestLink = () => (
  <NavLink
    localizedApp="Stdlib Test"
    appRoutePath="/test"
    icon={ICON}
    activeIcon={ACTIVE_ICON}
  />
);

const RootProviderProbe = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

const RootChildProbe = () => <div id="stdlib-test-root-child" style={{ display: "none" }} />;

const SettingsSectionProbe = () => {
  const [, refresh] = React.useReducer((n) => n + 1, 0);

  React.useEffect(() => {
    settingsSectionFuture.pull(refresh);
  }, [refresh]);

  if (!SettingsSection || !SettingsSectionTitle) {
    return null;
  }

  const Section = SettingsSection as SettingsSectionWithChildren;
  const SectionTitle = SettingsSectionTitle as SettingsSectionTitleWithChildren;

  return (
    <Section filterMatchQuery="stdlib test diagnostics">
      <SectionTitle>Stdlib Test Diagnostics</SectionTitle>
      <div style={{ opacity: 0.85 }}>This section is injected by the test module.</div>
    </Section>
  );
};

const RegisteredMenu = () => {
  return (
    <MenuItemSubMenu depth={1} displayText="Stdlib diagnostics" placement="right-start">
      <MenuItem divider="before" onClick={openDiagnosticsModal}>
        Open diagnostics modal
      </MenuItem>
      <MenuItem onClick={() => console.info("[test] open /test from the left nav link")}>Open /test from nav link</MenuItem>
    </MenuItemSubMenu>
  );
};

export const registerStdlibDiagnostics = (mod: ModuleInstance): void => {
  const registrar = createRegistrar(mod);
  registrar.register("topbarLeftButton", <TopbarLeftProbe />);
  registrar.register("topbarRightButton", <TopbarRightProbe />);
  registrar.register("playbarButton", <PlaybarButtonProbe />);
  registrar.register("playbarWidget", <PlaybarWidgetProbe />);
  registrar.register("route", <Route path="/test/*" element={<AppLazy />} />);
  registrar.register("navlink", <TestLink />);
  registrar.register("menu", <RegisteredMenu />);
  registrar.register("rootChild", <RootChildProbe />);
  registrar.register("rootProvider", <RootProviderProbe />);
  registrar.register("settingsSection", <SettingsSectionProbe />);
};
