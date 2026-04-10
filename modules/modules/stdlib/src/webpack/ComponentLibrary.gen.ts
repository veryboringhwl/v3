import("./ComponentLibrary.types.tsx").then((_m) => {});

import type * as ComponentLibrary_xpui_ts from "./ComponentLibrary.xpui.ts";
export let UI: typeof ComponentLibrary_xpui_ts.UI;
import("./ComponentLibrary.xpui.ts").then((m) => {
  UI = m.UI;
});
