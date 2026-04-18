import { Builder, readJSON, Transpiler } from "jsr:@delu/tailor";

import { ensureDir } from "jsr:@std/fs/ensure-dir";
import path from "node:path";

export type ClassmapInfo = {
  classmap: any;
  version: number;
  timestamp: number;
};

export default async function (classmapInfos: ClassmapInfo[], inputDirs: string[]) {
  for (const inputDir of inputDirs) {
    const metadata = await readJSON<any>(path.join(inputDir, "metadata.json"));

    for (const { classmap, version, timestamp } of classmapInfos) {
      const m = Object.assign({}, metadata);
      m.version += `+cm-${version}-${timestamp.toString(36)}`;

      const identifier = `${m.authors[0]}.${m.name}`;
      const fingerprint = `${m.authors[0]}.${m.name}@${m.version}`;
      const outputDir = path.join("dist", fingerprint);
      await ensureDir(outputDir);

      const transpiler = new Transpiler(classmap, false);
      const builder = new Builder(transpiler, { metadata, identifier, inputDir, outputDir });

      try {
        await builder.build({ js: true, css: true, unknown: true });
        await Deno.writeTextFile(path.join(outputDir, "metadata.json"), JSON.stringify(m));
      } catch (err) {
        await Deno.remove(outputDir, { recursive: true });
        console.warn(`Build for ${fingerprint} failed with error: ${err}`);
      }
    }
  }
}
