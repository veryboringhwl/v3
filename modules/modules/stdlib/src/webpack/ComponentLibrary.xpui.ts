import { fnStr } from "/hooks/util.ts";
import { exportedFunctions, exportedForwardRefs, exportedMemos } from "./index.ts";

await CHUNKS.xpui.promise;

const encoreIdRegex = /"data-encore-id"\s*:\s*(?:[a-zA-Z_$][\w$]*\.)*([A-Z][\w]*)\b/;

const componentPairs = [
  exportedFunctions.map((f) => [f, f]),
  exportedForwardRefs.map((f) => [(f as any).render, f]),
  exportedMemos.map((f) => {
    const type = (f as any).type;
    // memo(forwardRef(fn)) - go one level deeper
    const inner = type?.$$typeof === Symbol.for("react.forward_ref") ? type.render : type;
    return [inner, f];
  }),
]
  .flat()
  .map(([s, f]) => {
    const match = fnStr(s)?.match(encoreIdRegex);
    return match?.[1] ? [match[1], f] : null;
  })
  .filter(Boolean);

export const UI: any = Object.fromEntries(componentPairs);
