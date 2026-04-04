import { exportedContexts } from "./index.ts";

await CHUNKS.xpui.promise;

export const FilterContext = exportedContexts.find((c) => (c as any)._currentValue2?.setFilter)!;
