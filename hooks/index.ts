// @deno-types="./mixins.ts"
import mixin, { applyTransforms } from "./mixins.js";
// @deno-types="./module.ts"
import {
	enableAllLoadable,
	enableAllLoadableMixins,
	INTERNAL_MIXIN_LOADER,
	INTERNAL_TRANSFORMER,
	loadLocalModules,
	loadRemoteModules,
} from "./module.js";

await Promise.all([mixin(INTERNAL_TRANSFORMER), loadLocalModules()]);
console.time("onSpotifyPreInit");
await enableAllLoadableMixins();
console.timeEnd("onSpotifyPreInit");

console.time("onSpotifyInit");

const modulesPath = await applyTransforms("/xpui-modules.js");
await import(modulesPath);

const snapshotPath = await applyTransforms("/xpui-snapshot.js");
await import(snapshotPath);

console.timeEnd("onSpotifyInit");
console.time("onSpotifyPostInit");

await Promise.all(INTERNAL_MIXIN_LOADER.awaitedMixins);
await enableAllLoadable();

console.timeEnd("onSpotifyPostInit");
requestIdleCallback(loadRemoteModules);
