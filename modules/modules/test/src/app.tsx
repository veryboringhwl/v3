// deno-lint-ignore no-unused-vars
import { React } from "/modules/stdlib/src/expose/React.ts";
import { TestPage } from "./pages/TestPage.tsx";
import { Route, Routes } from "/modules/stdlib/src/webpack/ReactComponents.ts";

export default function App() {
  return (
    <div id="TestPageID">
      <Routes>
        <Route path="/" element={<TestPage />} />
      </Routes>
    </div>
  );
}
