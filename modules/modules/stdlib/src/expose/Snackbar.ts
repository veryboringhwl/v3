import { transformer } from "../../mixin.ts";

import type SnackbarT from "npm:notistack";

export type Snackbar = typeof SnackbarT;
export let Snackbar: Snackbar;

transformer<Snackbar>(
  (emit) => (str) => {
    str = str.replace(
      /var ([a-zA-Z_$][\w$]*);return\(\1=([^;]*?)\)\.enqueueSnackbar=/,
      "var $1;return($1=__Snackbar=$2).enqueueSnackbar=",
    );
    let __Snackbar: Snackbar | undefined ;
    Object.defineProperty(globalThis, "__Snackbar", {
      set: (value) => {
        emit(value);
        __Snackbar = value;
      },
      get: () => __Snackbar,
    });
    return str;
  },
  {
    glob: /^\/xpui-modules\.js/,
  },
).then(($) => {
  Snackbar = $;
});
