import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";
import { NavTo } from "/modules/stdlib/src/webpack/ReactComponents.ts";

export const HomePage = () => {
  return (
    <>
      <UI.Text variant="titleMedium">stdlib Component Example Page</UI.Text>
      <UI.Text variant="bodySmall">This contains every component that stdlib exports</UI.Text>
      <UI.Text variant="bodySmall">
        You can use this to see how to use the components and what props it accepts
      </UI.Text>
      <NavTo replace={true} to="/spicetify/test/ReactComponent">
        <UI.Text variant="bodySmall">Go to React Component Page</UI.Text>
      </NavTo>
      <NavTo replace={true} to="/spicetify/test/EncoreComponent">
        <UI.Text variant="bodySmall"> Go to Encore Component Page</UI.Text>
      </NavTo>
    </>
  );
};
