import type { PlatformAutoGen } from "/hooks/PlatformAutoGen.d.ts";
import { transformer } from "../../mixin.ts";

export type Platform = PlatformAutoGen;
export let Platform: Platform;

transformer<Platform>(
  (emit) => (str) => {
    str = str.replace(
      /{(?=[^{}]*(?:{[^{}]*(?:{[^{}]*(?:{[^{}]*}[^{}]*)*}[^{}]*)*}[^{}]*)*(?<=[,{])version:)(?=[^{}]*(?:{[^{}]*(?:{[^{}]*(?:{[^{}]*}[^{}]*)*}[^{}]*)*}[^{}]*)*(?<=[,{])container:)/,
      "__Platform={",
    );
    Object.defineProperty(globalThis, "__Platform", {
      set: emit,
    });
    return str;
  },
  {
    glob: /^\/xpui-modules\.js/,
  },
).then(($) => {
  Platform = $;
  const registry = $.getRegistry();
  for (const s of registry._map.keys()) {
    const getter = `get${s.description}`;
    if (Object.hasOwn(Platform, getter)) {
      continue;
    }
    Object.defineProperty(Platform, getter, {
      get: () => () => registry.resolve(s),
    });
  }
});
