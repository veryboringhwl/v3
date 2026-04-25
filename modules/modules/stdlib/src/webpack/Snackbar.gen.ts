import type * as Snackbar_xpui_ts from "./Snackbar.xpui.ts";
export let useSnackbar: typeof Snackbar_xpui_ts.useSnackbar;
export let enqueueSnackbar: typeof Snackbar_xpui_ts.enqueueSnackbar;
export let enqueueCustomSnackbar: typeof Snackbar_xpui_ts.enqueueCustomSnackbar;
import("./Snackbar.xpui.ts").then((m) => {
  useSnackbar = m.useSnackbar;
  enqueueSnackbar = m.enqueueSnackbar;
  enqueueCustomSnackbar = m.enqueueCustomSnackbar;
});
