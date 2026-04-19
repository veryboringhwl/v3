import { React } from "/modules/stdlib/src/expose/React.ts";
import {
  future,
  SettingsRow,
  SettingsRowEnd,
  SettingsRowStart,
  SettingsSection,
} from "/modules/stdlib/src/expose/SettingsSection.ts";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";
import { Toggle } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { t } from "../i18n.ts";
import {
  getHideCoreModules,
  setHideCoreModules,
  subscribeHideCoreModules,
} from "../marketplaceSettings.ts";

export const MarketplaceSettingsSection = () => {
  const [, refresh] = React.useReducer((n) => n + 1, 0);
  const [hideCoreModules, setHideCoreModulesState] = React.useState(() => getHideCoreModules());

  React.useEffect(() => {
    future.pull(refresh);
  }, [refresh]);

  React.useEffect(() => {
    return subscribeHideCoreModules(setHideCoreModulesState);
  }, []);

  return (
    <SettingsSection filterMatchQuery="marketplace modules">
      <UI.Text as="h2" semanticColor="textBase" variant="bodyMediumBold">
        {t("marketplace.settings.heading")}
      </UI.Text>
      <SettingsRow>
        <SettingsRowStart>
          <UI.Text as="label" semanticColor="textSubdued" variant="bodySmall">
            {t("marketplace.settings.hideCore")}
          </UI.Text>
        </SettingsRowStart>
        <SettingsRowEnd>
          <Toggle
            id="marketplace-hide-core-modules"
            onSelected={(nextValue: boolean) => {
              setHideCoreModules(nextValue);
            }}
            value={hideCoreModules}
          />
        </SettingsRowEnd>
      </SettingsRow>
    </SettingsSection>
  );
};
