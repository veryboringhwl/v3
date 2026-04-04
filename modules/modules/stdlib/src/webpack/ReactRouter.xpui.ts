import { findBy } from "/hooks/util.ts";
import { exportedFunctions, modules } from "./index.ts";
import { fnStr } from "/hooks/util.ts";

import type { useLocation as useLocationT, useMatch as useMatchT } from "npm:react-router";
import { webpackRequire } from "../wpunpk.mix.ts";

await CHUNKS.xpui.promise;

const [ReactRouterModuleID] = modules.find(([_, v]) => fnStr(v).includes("React Router"))!;
const ReactRouterModule = Object.values(webpackRequire(ReactRouterModuleID));

// https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx#L131
export const useMatch: typeof useMatchT = ReactRouterModule.find(
  (f) => fnStr(f).includes("let{pathname:") && !fnStr(f).includes(".createElement("),
);

export const useLocation: typeof useLocationT = findBy("location", "useContext")(exportedFunctions);
