import { display } from "/modules/stdlib/lib/modal.tsx";
import { React } from "/modules/stdlib/src/expose/React.ts";
import {
  SettingsSection,
  SettingsSectionControl,
  SettingsSectionLabel,
  SettingsSectionRow,
  future as settingsSectionFuture,
} from "/modules/stdlib/src/expose/SettingsSection.ts";
import { NavLink } from "/modules/stdlib/src/registers/navlink.tsx";
import { PlaybarButton } from "/modules/stdlib/src/registers/playbarButton.tsx";
import { PlaybarWidget } from "/modules/stdlib/src/registers/playbarWidget.tsx";
import { TopbarLeftButton } from "/modules/stdlib/src/registers/topbarLeftButton.tsx";
import { TopbarRightButton } from "/modules/stdlib/src/registers/topbarRightButton.tsx";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";
import {
  ContextMenu,
  Menu,
  MenuItem,
  MenuItemSubMenu,
  Toggle,
} from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { usePanelAPI } from "/modules/stdlib/src/webpack/ReactHooks.ts";
import { hash } from "../../mod.tsx";
import { ACTIVE_ICON, ICON } from "../static.ts";
import { DiagnosticsModal } from "./DiagnosticsModal.tsx";

const ICON_PATH =
  '<path d="M11.472.279L2.583 10.686l-.887 4.786 4.588-1.625L15.173 3.44 11.472.279zM5.698 12.995l-2.703.957.523-2.819v-.001l2.18 1.863zm-1.53-2.623l7.416-8.683 2.18 1.862-7.415 8.683-2.181-1.862z"/>';

export const AppLazy = React.lazy(() => import("../app.tsx"));

const openDiagnosticsModal = () => {
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

export const TopbarLeftProbe = () => <TopbarLeftButton {...registerButtonProps} />;

export const TopbarRightProbe = () => (
  <ContextMenu
    menu={
      <Menu>
        <MenuItem>Context action</MenuItem>
      </Menu>
    }
    offset={[0, 8]}
    placement="top"
    trigger="right-click"
  >
    <TopbarRightButton {...registerButtonProps} />
  </ContextMenu>
);

export const PlaybarWidgetProbe = () => <PlaybarWidget {...registerButtonProps} />;

export const PlaybarButtonProbe = () => {
  const { isActive, panelSend } = usePanelAPI(hash?.state);

  const handleButtonClick = () => {
    console.log(isActive, panelSend);
    if (hash) {
      panelSend(hash.event);
      console.log(hash);
    }
  };
  return (
    <PlaybarButton
      icon={ICON_PATH}
      isActive={isActive}
      label="test-button"
      onClick={handleButtonClick}
    />
  );
};

export const TestLink = () => (
  <NavLink activeIcon={ACTIVE_ICON} appRoutePath="/test" icon={ICON} localizedApp="Stdlib Test" />
);

export const SettingsSectionProbe = () => {
  const [, refresh] = React.useReducer((n) => n + 1, 0);
  const [isChecked, setIsChecked] = React.useState(false);

  React.useEffect(() => {
    settingsSectionFuture.pull(refresh);
  }, [refresh]);

  return (
    <SettingsSection filterMatchQuery="test">
      <UI.Text as="h2" semanticColor="textBase" variant="bodyMediumBold">
        Settings Section Title
      </UI.Text>
      <SettingsSectionRow>
        <SettingsSectionLabel>
          <UI.Text as="label" semanticColor="textSubdued" variant="bodySmall">
            Settings Section Example
          </UI.Text>
        </SettingsSectionLabel>
        <SettingsSectionControl>
          <Toggle
            id="toggle-probe"
            onSelected={(newValue) => {
              setIsChecked(newValue);
            }}
            value={isChecked}
          />
        </SettingsSectionControl>
      </SettingsSectionRow>
    </SettingsSection>
  );
};

export const RegisteredMenu = () => {
  return (
    <MenuItemSubMenu depth={1} displayText="Stdlib diagnostics" placement="right-start">
      <MenuItem divider="before" onClick={openDiagnosticsModal}>
        Open diagnostics modal
      </MenuItem>
      <MenuItem onClick={() => console.info("[test] open /test from the left nav link")}>
        Open /test from nav link
      </MenuItem>
    </MenuItemSubMenu>
  );
};
