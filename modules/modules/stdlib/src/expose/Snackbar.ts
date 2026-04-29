import type SnackbarT from "npm:notistack";
import { transformer } from "../../mixin.ts";

export type Snackbar = typeof SnackbarT;
export let Snackbar: Snackbar;
export let enqueueImageSnackbar: any;
export let enqueueCustomSnackbar: any;

// figue out why this works in v2 but not here?
transformer<Snackbar>(
  (emit) => (str) => {
    str = str.replace(
      /var ([a-zA-Z_$][\w$]*);return\(\1=([^;]*?)\)\.enqueueSnackbar=/,
      "var $1;return($1=globalThis.__Snackbar=$2).enqueueSnackbar=",
    );
    Object.defineProperty(globalThis, "__Snackbar", {
      set: emit,
    });
    return str;
  },
  {
    glob: /^\/xpui-modules\.js/,
    wait: false,
  },
).then(($) => {
  Snackbar = $;
});

transformer(
  (emit) => (str) => {
    str = str.replace(/(=)(\(\({[^}]*,\s*imageSrc)/, "$1__enqueueImageSnackbar=$2");
    Object.defineProperty(globalThis, "__enqueueImageSnackbar", {
      set: emit,
    });
    return str;
  },
  {
    glob: /^\/xpui-modules\.js/,
  },
).then(($: any) => {
  enqueueImageSnackbar = $;
});

transformer(
  (emit) => (str) => {
    str = str.replace(/(=)[^=]*\(\)\.enqueueCustomSnackbar/, "$1__enqueueCustomSnackbar=$2");
    Object.defineProperty(globalThis, "__enqueueCustomSnackbar", {
      set: emit,
    });
    return str;
  },
  {
    glob: /^\/xpui-modules\.js/,
  },
).then(($: any) => {
  enqueueImageSnackbar = $;
});
