import { hotwired, type MixinContext } from "/hooks/module.ts";

const nativeObjectDefineProperty = Object.defineProperty;
Object.defineProperty = (obj, prop, descriptor) => {
  prop !== "prototype" && descriptor && (descriptor.configurable ??= true);
  return nativeObjectDefineProperty(obj, prop, descriptor);
};

const { promise, transformer, signal } = await hotwired<MixinContext>(import.meta);

export { transformer };

signal.addEventListener("abort", () => {
  Object.defineProperty = nativeObjectDefineProperty;
});

promise.wrap(
  (async () => {
    await Promise.all([
      import("./src/expose/index.ts"),
      import("./src/registers/index.ts"),
      import("./src/events.mix.ts"),
      import("./src/wpunpk.mix.ts"),
    ]);
  })(),
);
