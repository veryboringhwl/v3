import type * as FilterContext_xpui_ts from "./FilterContext.xpui.ts";
export let FilterContext: typeof FilterContext_xpui_ts.FilterContext;
import("./FilterContext.xpui.ts").then((m) => {
  FilterContext = m.FilterContext;
});
