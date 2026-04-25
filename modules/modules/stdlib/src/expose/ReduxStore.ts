import type { Store } from "npm:@types/redux";
import { transformer } from "../../mixin.ts";

export type ReduxStore = Store;
export let ReduxStore: ReduxStore;

transformer<Storage>(
  (emit) => (str) => {
    str = str.replace(
      /\.jsx\)\(([a-zA-Z_$][\w$]*),\{store:([a-zA-Z_$][\w$]*),platform:([a-zA-Z_$][\w$]*)\}\)/,
      ".jsx)($1,{store:__ReduxStore=$2,platform:__Platform=$3})",
    );
    Object.defineProperty(globalThis, "__ReduxStore", {
      set: emit,
    });

    // Object.defineProperty(globalThis, "__Platform", {
    // 	set: (value) => {
    // 		emit();
    // 		Platform = value;
    // 	},
    // 	get: () => Platform,
    // });
    return str;
  },
  {
    glob: /^\/xpui-snapshot\.js/,
  },
).then(($) => {
  ReduxStore = $;
});
