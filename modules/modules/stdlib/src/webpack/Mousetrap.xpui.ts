import type MousetrapT from "npm:@types/mousetrap";
import { exports } from "./index.ts";

await globalThis.CHUNKS.xpui.promise;

export const Mousetrap: typeof MousetrapT = exports.find((m) => m.addKeycodes);
