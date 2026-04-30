import type { Tippy as TippyT } from "npm:tippy.js";
import { transformer } from "../../mixin.ts";

export type Tippy = TippyT;
export let Tippy: Tippy;

transformer<Tippy>(
  (emit) => (str) => {
    str = str.replace(/(([a-zA-Z_$][\w$]*)\.setDefaultProps=)/, "__Tippy=$2;$1");
    Object.defineProperty(globalThis, "__Tippy", {
      set: emit,
    });
    return str;
  },
  {
    glob: /^\/xpui-modules\.js/,
  },
).then(($) => {
  Tippy = $;
});
