import { fnStr } from "/hooks/util.ts";
import { webpackRequire } from "../wpunpk.mix.ts";
import { matchWebpackModule } from "../wpunpk.ts";

await (CHUNKS["/dwp-panel-section.js"] ??= Promise.withResolvers()).promise;

export let PanelContainer: React.FC<any>;
export let PanelContent: React.FC<any>;
export let PanelHeader: React.FC<any>;

matchWebpackModule(
  (_id, module) => {
    const moduleStr = fnStr(module);
    return moduleStr.includes("Desktop_PanelContainer_Id");
  },
  (id, _$) => {
    const module = Object.values(webpackRequire(id));
    PanelContainer = module.find((m) => typeof m === "function");
  },
);

matchWebpackModule(
  (_id, module) => {
    const moduleStr = fnStr(module);
    return moduleStr.includes("fixedHeader");
  },
  (id, _$) => {
    const module = webpackRequire(id);
    PanelContent = Object.values(module)[0];
  },
);

matchWebpackModule(
  (_id, module) => {
    const moduleStr = fnStr(module);
    return moduleStr.includes("PanelHeader_CloseButton");
  },
  (id, _$) => {
    const module = webpackRequire(id);
    PanelHeader = Object.values(module)[0];
  },
);
