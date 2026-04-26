import type { IndexLoadFn, IndexPreloadFn } from "/hooks/module.ts";

export const preload: IndexPreloadFn = async (context) => {
  return await (await import("./preload.ts")).default(context.module);
};

export const load: IndexLoadFn = async (context) => {
  return await (await import("./load.tsx")).default(context.module);
};
