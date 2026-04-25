import { transformer } from "../../mixin.ts";

export let enqueueImageSnackbar: any;

// TODO: replace with a custom enqueueCustomSnackbar wrapper
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
    wait: false,
  },
).then(($: any) => {
  enqueueImageSnackbar = $;
});
