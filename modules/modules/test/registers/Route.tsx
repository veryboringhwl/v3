import { Route, Routes } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { ComponentPage } from "../page/ComponentPage.tsx";
import { HomePage } from "../page/HomePage.tsx";

export function TestRoute() {
  return (
    <div id="TestPageID">
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<ComponentPage />} path="/TestPage1" />
        <Route element={<HomePage />} path="/TestPage2" />
      </Routes>
    </div>
  );
}
