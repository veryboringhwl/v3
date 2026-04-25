import {
  type WebpackModule,
  type WebpackRequire,
  webpackRequire,
  webpackRequireReady,
} from "../wpunpk.mix.ts";

export let modules: Array<[number, WebpackModule]>;
export let exports: Array<Record<string, any>>;
export let exported: Array<any>;

export let exportedFunctions: Array<Function>;

export let exportedReactObjects: Partial<Record<any, any[]>>;
export let exportedContexts: Array<React.Context<any>>;
export let exportedForwardRefs: Array<React.ForwardRefExoticComponent<any>>;
export let exportedMemos: React.NamedExoticComponent[];
export let exportedMemoForwardRefs: Array<
  React.NamedExoticComponent & { type: React.ForwardRefExoticComponent<any> }
>;

export const analyzeWebpackRequire = (webpackRequire: WebpackRequire) => {
  const modules = Object.entries(webpackRequire.m) as Array<[keyof any, WebpackModule]>;
  const exports = modules.map(([id]) => webpackRequire(id)) as Array<Record<string, any>>;
  const exported = exports
    .filter((module) => typeof module === "object")
    .flatMap((module) => {
      try {
        return Object.values(module);
      } catch (_) {}
    })
    .filter(Boolean) as Array<any>;

  const isFunction = (obj: any): obj is Function => typeof obj === "function";
  const exportedFunctions = exported.filter(isFunction);

  const exportedReactObjects = Object.groupBy(exported, (x) => x.$$typeof);
  const exportedContexts = (exportedReactObjects[Symbol.for("react.context") as any] ??
    []) as Array<React.Context<any>>;
  const exportedForwardRefs = (exportedReactObjects[Symbol.for("react.forward_ref") as any] ??
    []) as Array<React.ForwardRefExoticComponent<any>>;
  const exportedMemos = (exportedReactObjects[Symbol.for("react.memo") as any] ??
    []) as React.NamedExoticComponent[];
  const exportedMemoForwardRefs = exportedMemos.filter(
    (m) => m.type?.$$typeof === Symbol.for("react.forward_ref"),
  ) as Array<React.NamedExoticComponent & { type: React.ForwardRefExoticComponent<any> }>;

  return {
    modules,
    exports,
    exported,
    exportedFunctions,
    exportedReactObjects,
    exportedContexts,
    exportedForwardRefs,
    exportedMemos,
    exportedMemoForwardRefs,
  };
};

CHUNKS["/xpui-modules.js"] ??= Promise.withResolvers();
CHUNKS["/xpui-snapshot.js"] ??= Promise.withResolvers();

Object.assign(CHUNKS, {
  xpui: {
    promise: Promise.all([
      CHUNKS["/xpui-modules.js"].promise,
      CHUNKS["/xpui-snapshot.js"].promise,
    ]) as any,
  },
});

export const ready = (async () => {
  await globalThis.CHUNKS.xpui.promise;
  await webpackRequireReady;
  const analysis = analyzeWebpackRequire(webpackRequire);
  modules = analysis.modules;
  exports = analysis.exports;
  exported = analysis.exported;
  exportedFunctions = analysis.exportedFunctions;
  exportedReactObjects = analysis.exportedReactObjects;
  exportedContexts = analysis.exportedContexts;
  exportedForwardRefs = analysis.exportedForwardRefs;
  exportedMemos = analysis.exportedMemos;
  exportedMemoForwardRefs = analysis.exportedMemoForwardRefs;
  return analysis;
})();

await ready;
