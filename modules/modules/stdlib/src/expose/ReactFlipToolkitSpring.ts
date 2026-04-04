import { transformer } from "../../mixin.ts";

import type { spring } from "npm:react-flip-toolkit";

export type ReactFlipToolkitSpring = typeof spring;
export let ReactFlipToolkitSpring: ReactFlipToolkitSpring;

transformer<ReactFlipToolkitSpring>(
  (emit) => (str) => {
    str = str.replace(
      /([a-zA-Z_$][\w$]*)\s*=\s*((?:function|\()(?=[^}]*?\bspringConfig\b)(?=[^}]*?\bovershootClamping\b)[^}]*?)/,
      "$1=__ReactFlipToolkitSpring=$2",
    );
    Object.defineProperty(globalThis, "__ReactFlipToolkitSpring", {
      set: emit,
    });
    return str;
  },
  {
    glob: /^\/xpui-modules\.js/,
  },
).then(($) => {
  ReactFlipToolkitSpring = $;
});
