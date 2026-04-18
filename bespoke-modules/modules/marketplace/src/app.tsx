import { Route, Routes } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import Marketplace from "./pages/Marketplace.tsx";
import ModulePage from "./pages/Module.tsx";

export default function () {
  return (
    <div id="marketplace">
      <Routes>
        <Route element={<Marketplace />} path="/" />
        <Route element={<ModulePage />} path="/module/:aurl" />
      </Routes>
    </div>
  );
}
