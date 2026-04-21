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
      <SettingsRow>
        <SettingsRowStart>
          <UI.Text as="label" semanticColor="textSubdued" variant="bodySmall">
            Settings Section Example
          </UI.Text>
        </SettingsRowStart>
        <SettingsRowEnd>
          <Toggle
            id="toggle-probe"
            onSelected={(newValue) => {
              setIsChecked(newValue);
            }}
            value={isChecked}
          />
        </SettingsRowEnd>
      </SettingsRow>
    </SettingsSection>
  );
};
