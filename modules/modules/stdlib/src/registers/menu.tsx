import { transformer } from "../../mixin.ts";
import { React } from "../expose/React.ts";
import { Registry } from "./registry.ts";

type __MenuContext = React.Context<MenuContext>;

declare global {
  var __MenuContext: __MenuContext;
}

type MenuContext = {
  props: any;
  trigger: string;
  target: HTMLElement;
};

const registry = new (class extends Registry<React.ReactNode> {
  override add(value: React.ReactNode): this {
    refresh?.();
    return super.add(value);
  }

  override delete(value: React.ReactNode): boolean {
    refresh?.();
    return super.delete(value);
  }
})();

let refresh: React.DispatchWithoutAction | undefined;
export default registry;

export const useMenuItem = () => React.useContext(globalThis.__MenuContext);

declare global {
  var __renderMenuItems: any;
}

globalThis.__renderNowPlayingBarWidgets = () => [
  React.createElement(() => {
    [, refresh] = React.useReducer((n) => n + 1, 0);
    return <>{registry.all()}</>;
  }),
];

transformer(
  (emit) => (str) => {
    str = str.replace(/("Menu".+?children:)([\w$][\w$\d]*)/, "$1[__renderMenuItems(),$2].flat()");

    const contextMenuBlockMatch = str.match(
      /[\w_$]+\s*=\s*\({menu:[\s\S]+?"context-menu"[\s\S]+?\}\)/,
    );
    if (!contextMenuBlockMatch) return str;
    const contextMenuBlock = contextMenuBlockMatch[0];

    const argsMatch = contextMenuBlock.match(/^[\w_$]+\s*=\s*\(\{([^}]+)\}\)/);
    const argsString = argsMatch ? argsMatch[1] : "";

    const menu = argsString.match(/menu:\s*([\w_$]+)/)?.[1] ?? "null";
    const trigger = argsString.match(/trigger:\s*([\w_$]+)/)?.[1] ?? "null";
    const target = argsString.match(/triggerRef:\s*([\w_$]+)/)?.[1] ?? "null";

    const react = contextMenuBlock.match(/([\w_$]+)\.useRef/)?.[1] ?? "i";

    const value = `{props:${menu}?.props,trigger:${trigger},target:${target}}`;

    str = str.replace(
      /render:\s*([\w_$]+|\(([\w_$]+)\))\s*=>\s*(\(0,([\w_$]+)\.jsx\)\("div",\{[^}]+:"context-menu"[\s\S]+?\}\))/,
      (_, fullArgs, singleArg, originalRender, jsxVar) => {
        const argName = singleArg || fullArgs;
        return `render:(${argName})=>{const value=${value};return (${jsxVar}.jsx)((globalThis.__MenuContext??=${react}.createContext(null)).Provider,{value,children:((${argName})=>${originalRender})(${argName})})}`;
      },
    );

    emit();
    return str;
  },
  {
    glob: /^\/xpui-modules\.js/,
  },
);
