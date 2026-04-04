import { exports } from "./index.ts";

import type MousetrapT from "npm:@types/mousetrap";

await CHUNKS.xpui.promise;

export const Mousetrap: typeof MousetrapT = exports.find((m) => m.addKeycodes);
