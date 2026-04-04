import type { ModuleInstance } from "/hooks/module.ts";

export const createLogger = (mod: ModuleInstance) => {
  const hookedMethods = new Set(["debug", "error", "info", "log", "warn"]);

  return new Proxy(globalThis.console, {
    get(target, p, receiver) {
      const func: unknown = Reflect.get(target, p, receiver);

      if (typeof p === "string" && hookedMethods.has(p) && typeof func === "function") {
        // @ts-expect-error
        return (...data: any[]) => func.call(target, `[${mod.getModuleIdentifier()}]:`, ...data);
      }

      return func;
    },
  });
};
