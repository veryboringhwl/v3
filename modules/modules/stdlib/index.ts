import { hotwire, type IndexLoadFn, type IndexMixinFn } from "/hooks/module.ts";

export const mixin: IndexMixinFn = hotwire(
  import.meta,
  "./mixin.ts",
  async () => await import("./mixin.ts"),
);

export const load: IndexLoadFn = hotwire(import.meta, "./load.ts", () => import("./load.ts"));
