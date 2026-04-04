import type * as Mousetrap_xpui_ts from "./Mousetrap.xpui.ts";
export let Mousetrap: typeof Mousetrap_xpui_ts.Mousetrap;
import("./Mousetrap.xpui.ts").then((m) => {
  Mousetrap = m.Mousetrap;
});
