import { findBy } from "/hooks/util.ts";
import { exported, exportedFunctions } from "./index.ts";

await CHUNKS.xpui.promise;

export const Color: Function & {
  Format: any;
} = Object.assign(findBy("this.rgb")(exportedFunctions)!, {
  Format: exported.find((m) => m.RGBA)!,
});

export const Locale: any = exported.find((m) => m.getTranslations);

export const createUrlLocale: Function = findBy("has", "baseName", "language")(exportedFunctions);

export const InternalPropetyMap: any = exported.find((o) => o.Builder);
