import { React } from "../expose/React.ts";


import { transformer } from "../../mixin.ts";
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

const items = new Registry<React.ReactNode>();
export default items;

export const useMenuItem = () => React.useContext(globalThis.__MenuContext);

declare global {
  var __renderMenuItems: any;
}

globalThis.__renderMenuItems = () => items.all();
transformer(
  (emit) => (str) => {
    emit();

    // str = str.replace(/("Menu".+?children:)([\w$][\w$\d]*)/, "$1[__renderMenuItems(),$2].flat()");
    str = str.replace(/("Menu".+?children:)([\w$][\w$\d]*)/, "$1__renderMenuItems()");
    // const contextMenuBlock =
    //   str.match(/[\w_$]+\s*=\s*\(\{menu:[\s\S]+?"context-menu"[\s\S]+?\}\)/)?.[0] ?? "";

    // const [, menu, trigger, target] =
    //   matchLast(
    //     contextMenuBlock,
    //     /\{menu:([\w_$]+),[^}]*trigger:([\w_$]+),[^}]*triggerRef:([\w_$]+)/g,
    //   ) ?? [];

    // let value: string;
    // if (menu && trigger && target) {
    //   value = `{props:${menu}?.props,trigger:${trigger},target:${target}}`;
    // } else {
    //   value = `{props:e.menu?.props,trigger:e.trigger,target:e.triggerRef}`;
    // }

    // const react = (matchLast(str, /([\w_$]+)\.useRef/g) ?? [])[1] ?? "React";

    // str = str.replace(
    //   /render:([\w_$]+=>\(0,([\w_$]+)\.jsx\)\("div",\{[^}]+:"context-menu"[^}]*\}\))/,
    //   `render:(props)=>{const value=${value};return ($2.jsx)((globalThis.__MenuContext??=${react}.createContext(null)).Provider,{value,children:($1)(props)});}`,
    // );

    return str;
  },
  {
    glob: /^\/xpui-modules\.js/,
  },
);

export const createProfileMenuShouldAdd =
  () =>
  ({ trigger, target }: MenuContext) =>
    trigger === "click" && target.getAttribute("data-testid") === "user-widget-link";
