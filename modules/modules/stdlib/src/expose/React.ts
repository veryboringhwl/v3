// @deno-types="npm:@types/react@18.3.1"
import _React from "https://esm.sh/react@18.3.1";
// @deno-types="npm:@types/react-dom@18.3.1"
import _ReactDOM from "https://esm.sh/react-dom@18.3.1";
// @deno-types="npm:@types/react-dom@18.3.1/server"
import _ReactDOMServer from "https://esm.sh/react-dom@18.3.1/server";
import { postWebpackRequireHooks } from "../wpunpk.mix.ts";
import { matchWebpackModule } from "../wpunpk.ts";

export const React = _React;
export const ReactDOM = _ReactDOM;
export const ReactDOMServer = _ReactDOMServer;

postWebpackRequireHooks.push(($) => {
  matchWebpackModule(
    (_id, module) => {
      const moduleStr = module.toString();

      return moduleStr.includes(
        '"setState(...): takes an object of state variables to update or a function which returns an object of state variables."',
      );
    },
    (id) => {
      $.m[id] = function () {
        Object.assign(this, _React);
      };
    },
  );

  matchWebpackModule(
    (_id, module) => {
      const moduleStr = module.toString();

      return moduleStr.includes(',rendererPackageName:"react-dom"');
    },
    (id) => {
      $.m[id] = function () {
        Object.assign(this, _ReactDOM);
      };
    },
  );

  matchWebpackModule(
    (_id, module) => {
      const moduleStr = module.toString();

      return (
        moduleStr.search(
          /,([a-zA-Z_$][\w$]*)\.renderToString=([a-zA-Z_$][\w$]*)\.renderToString,/,
        ) !== -1
      );
    },
    (id) => {
      $.m[id] = function () {
        Object.assign(this, _ReactDOMServer);
      };
    },
  );
});

// import { transformer } from "../../mixin.ts";

// import type ReactT from "npm:@types/react";

// export type React = typeof ReactT;
// export let React: React;

// transformer<React>(
// 	(emit) => (str) => {
// 		str = str.replace(/([a-zA-Z_\$][\w\$]*\.prototype\.setState=)/, "__React=t;$1");
// 		Object.defineProperty(globalThis, "__React", {
// 			set: emit,
// 		});
// 		return str;
// 	},
// 	{
// 		glob: /^\/xpui-modules\.js/,
// 	},
// ).then(($) => {
// 	React = $;
// });
