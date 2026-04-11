// @deno-types="npm:@types/react@18.3.1/jsx-runtime"
import _ReactJSXRuntime from "https://esm.sh/react@18.3.1/jsx-runtime";
import { addPostWebpackRequireHook } from "../wpunpk.mix.ts";
import { matchWebpackModule } from "../wpunpk.ts";

export const ReactJSXRuntime = _ReactJSXRuntime;
export const { Fragment, jsx, jsxs } = _ReactJSXRuntime;

addPostWebpackRequireHook(($) => {
  matchWebpackModule(
    (_id, module) => {
      const moduleStr = module.toString();
      return (
        moduleStr.includes('"__self"') &&
        moduleStr.includes('"__source"') &&
        moduleStr.includes('Symbol.for("react.element")') &&
        moduleStr.includes('Symbol.for("react.fragment")')
      );
    },
    (id) => {
      $.m[id] = function () {
        Object.assign(this, _ReactJSXRuntime);
      };
    },
  );
});
