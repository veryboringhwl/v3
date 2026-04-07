import path from "node:path";
import { genClassMapDts } from "../build/lib.ts";

import { GH_RAW_CLASSMAP_URL } from "./classmap-info.ts";

const _response = await fetch(GH_RAW_CLASSMAP_URL);
// const classmap = await response.text();

const classmap = await Deno.readTextFile("./classmap.json");
const classmapPath = "classmap.json";
await Deno.writeTextFile(classmapPath, classmap);
console.log(`Fetched and saved classmap to ${classmapPath}`);

for await (const module of Deno.readDir("modules")) {
  if (!module.isDirectory) {
    continue;
  }

  const classmapDts = genClassMapDts(JSON.parse(classmap));
  const classmapDtsPath = path.join("modules", module.name, "classmap.d.ts");

  await Deno.writeTextFile(classmapDtsPath, classmapDts);
}
