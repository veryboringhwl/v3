import type * as Snackbar_xpui_ts from "./Snackbar.xpui.ts";
export let useSnackbar: typeof Snackbar_xpui_ts.useSnackbar;
export let useCustomSnackbar: typeof Snackbar_xpui_ts.useCustomSnackbar;
import("./Snackbar.xpui.ts").then((m) => {
  useSnackbar = m.useSnackbar;
  useCustomSnackbar = m.useCustomSnackbar;
});
