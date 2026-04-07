import { Route, Routes } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { TestPage } from "./pages/TestPage.tsx";

export default function App() {
  return (
    <div id="TestPageID">
      <Routes>
        <Route element={<TestPage />} path="/" />
      </Routes>
    </div>
  );
}
