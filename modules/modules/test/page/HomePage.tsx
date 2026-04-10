import { NavTo } from "/modules/stdlib/src/webpack/ReactComponents.ts";

export const HomePage = () => {
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the Home Page!</p>
      <NavTo replace={true} to="/test/TestPage1">
        Go to Component Page
      </NavTo>
    </div>
  );
};
