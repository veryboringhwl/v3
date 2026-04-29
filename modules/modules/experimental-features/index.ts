import type { IndexLoadFn } from "/hooks/module.ts";

export const load: IndexLoadFn = async (context) => {
  return await (await import("./load.tsx")).default(context.module);
};
