import { fnStr } from "/hooks/util.ts";
import {
  exportedForwardRefs,
  exportedFunctions,
  exportedMemoForwardRefs,
  exportedMemos,
} from "./index.ts";

await CHUNKS.xpui.promise;

const encoreIdRegex = /["]data-encore-id["]\s*:\s*(?:[\w$]+\s*\.\s*)*([\w$]+)/;

const componentPairs = [
  exportedFunctions.map((f) => [f, f]),
  exportedForwardRefs.map((f) => [(f as any).render, f]),
  exportedMemos.map((f) => [(f as any).type, f]),
  exportedMemoForwardRefs.map((f) => [(f as any).type?.render ?? (f as any).render, f]),
]
  .flat()
  .map(([s, f]) => {
    const match = fnStr(s)?.match(encoreIdRegex);
    return match?.[1] ? [match[1], f] : null;
  })
  .filter(Boolean);

export const UI: any = Object.fromEntries(componentPairs);
