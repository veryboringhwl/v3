import type classNames from "npm:@types/classnames";
import { fnStr } from "/hooks/util.ts";
import { webpackRequire } from "../wpunpk.mix.ts";
import { modules } from "./index.ts";

await globalThis.CHUNKS.xpui.promise;

export const classnames: classNames = modules
  .filter(([_, v]) => fnStr(v).includes("[native code]"))
  .map(([i]) => webpackRequire(i))
  .find((e) => typeof e === "function");
