import type { Flipped as FlippedT, Flipper as FlipperT } from "npm:react-flip-toolkit";
import { exportedFunctions } from "./index.ts";

await CHUNKS.xpui.promise;

export const Flipper: FlipperT = exportedFunctions.find(
  (m) => m.prototype?.getSnapshotBeforeUpdate,
)!;
export const Flipped: typeof FlippedT = exportedFunctions.find(
  (m) => (m as any).displayName === "Flipped",
)!;
