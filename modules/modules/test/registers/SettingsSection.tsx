import { React } from "/modules/stdlib/src/expose/React.ts";
import {
  future,
  SettingsSection,
  SettingsSectionControl,
  SettingsSectionLabel,
  SettingsSectionRow,
} from "/modules/stdlib/src/expose/SettingsSection.ts";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";
import { Toggle } from "/modules/stdlib/src/webpack/ReactComponents.ts";

export const TestSettingsSection = () => {
  const [, refresh] = React.useReducer((n) => n + 1, 0);
  const [isChecked, setIsChecked] = React.useState(false);

  React.useEffect(() => {
    future.pull(refresh);
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
