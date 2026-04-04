import { fnStr } from "/hooks/util.ts";

import { webpackRequire } from "../wpunpk.mix.ts";
import { analyzeWebpackRequire } from "./index.ts";

await (CHUNKS["/dwp-full-screen-mode-container.js"] ??= Promise.withResolvers()).promise;

const { exportedFunctions } = analyzeWebpackRequire(webpackRequire);

export const useExtractedColor: Function = exportedFunctions.find(
  (m) =>
    fnStr(m).includes("extracted-color") ||
    (fnStr(m).includes("colorRaw") && fnStr(m).includes("useEffect")),
)!;
