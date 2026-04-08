import { transformer } from "../../mixin.ts";
import { Registry } from "./registry.ts";

const registry = new Registry<React.ReactNode>();
export default registry;

declare global {
  var __renderSettingSections: any;
}

globalThis.__renderSettingSections = () => registry.all();
transformer(
  (emit) => (str) => {
    emit();

    str = str.replace(
      /(\(0,l\.jsx\)\([a-zA-Z_$][\w$]*,{restartContainer:[^}]+}\),\s*\(0,l\.jsx\)\([a-zA-Z_$][\w$]*,{}\))\]/,
      "$1,...__renderSettingSections()]",
    );

    return str;
  },
  {
    wait: false,
    glob: /^\/xpui-routes-desktop-settings\.js/,
  },
);
