import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";
import { NavTo } from "/modules/stdlib/src/webpack/ReactComponents.ts";

export const HomePage = () => {
  return (
    <div>
      <UI.Text variant="headlineMedium">stdlib Component Example Page</UI.Text>
      <h1>stdlib Test Page</h1>
      <p>This contains every component that stdlib exports</p>
      <p>You can use this to see how to use the components and what props it accepts</p>
      <NavTo replace={true} to="/test/ReactComponent">
        Go to React Component Page
      </NavTo>
      <NavTo replace={true} to="/test/EncoreComponent">
        Go to Encore Component Page
      </NavTo>
    </div>
  );
};
