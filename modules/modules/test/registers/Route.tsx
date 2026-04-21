import { Route, Routes } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { EncoreComponentPage } from "/modules/test/page/EncoreComponentPage.tsx";
import { ReactComponentPage } from "/modules/test/page/ReactComponentPage.tsx";
import { HomePage } from "../page/HomePage.tsx";

export function TestRoute() {
  return (
    <div className="test-page contentSpacing" id="TestPageID">
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<ReactComponentPage />} path="/ReactComponent" />
        <Route element={<EncoreComponentPage />} path="/EncoreComponent" />
      </Routes>
    </div>
  );
}
