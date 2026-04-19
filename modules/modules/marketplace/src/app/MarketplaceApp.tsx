import { Route, Routes } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { MarketplacePage } from "../features/catalog/components/MarketplacePage.tsx";
import { ModulePage } from "../features/module/components/ModulePage.tsx";

export default function MarketplaceApp() {
  return (
    <div className="marketplace-app" id="marketplace">
      <Routes>
        <Route element={<MarketplacePage />} path="/" />
        <Route element={<ModulePage />} path="/module/:aurl" />
        <Route element={<MarketplacePage />} path="*" />
      </Routes>
    </div>
  );
}
