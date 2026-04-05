import postcssPluginRemapper, { type Mapping } from "./postcss-plugin-remapper/index.ts";

import { ensureFile } from "jsr:@std/fs@1.0.20/ensure-file";
import { fromFileUrl } from "jsr:@std/path@1.1.4/from-file-url";
import path from "node:path";
import swcPluginRemapper from "./swc-plugin-remapper/index.js";
import swcPluginTransformModuleSpecifiers from "./swc-plugin-transform-module-specifiers/index.js";
import swc from "npm:@swc/core@1.15.24";
import autoprefixer from "npm:autoprefixer@10.4.27";
import postcss from "npm:postcss@8.5.8";
import atImport from "npm:postcss-import@16.1.1";
import tailwindcss from "npm:tailwindcss@3.4.19";
import tailwindcssNesting from "npm:tailwindcss@3.4.19/nesting/index.js";

export type { Mapping };

interface SwcOpts {
  baseUrl: string;
  classmap: Mapping;
  filepath: string;
  timestamp: number;
  dev: boolean;
}

function generateSwcOptions(opts: SwcOpts): swc.Options {
  const devRules = opts.dev ? ([[`^(\\.?\\.\\/.*)$`, `$1?t=${opts.timestamp}`]] as const) : [];

  return {
    isModule: true,
    module: {
      type: "es6",
      strict: true,
      strictMode: true,
      lazy: false,
      importInterop: "none",
      resolveFully: true,
    },
    jsc: {
      baseUrl: path.resolve(opts.baseUrl),
      experimental: {
        plugins: [
          [
            fromFileUrl(swcPluginRemapper()),
            {
              mapping: { MAP: opts.classmap },
            },
          ],
          [
            fromFileUrl(swcPluginTransformModuleSpecifiers()),
            {
              rules: [
                [`\\.js(\\?.*)?$`, ".js$1"],
                [`\\.ts(\\?.*)?$`, ".js$1"],
                [`\\.mjs(\\?.*)?$`, ".js$1"],
                [`\\.mts(\\?.*)?$`, ".js$1"],
                [`\\.jsx(\\?.*)?$`, ".js$1"],
                [`\\.tsx(\\?.*)?$`, ".js$1"],
                ...devRules,
              ],
            },
          ],
        ],
      },
      loose: false,
      parser: {
        decorators: true,
        syntax: "typescript",
        tsx: true,
      },
      target: "esnext",
      transform: {
        decoratorVersion: "2022-03",
        react: {
          runtime: "automatic",
          importSource: "/modules/stdlib/src/expose",
        },
        useDefineForClassFields: false,
      },
    },
    sourceMaps: false,
  };
}

export class Transpiler {
  public constructor(
    private classmap: Mapping,
    public dev: boolean,
  ) {}

  public async js(
    input: string,
    output: string,
    baseUrl: string,
    filepath: string,
    timestamp: number,
  ) {
    let program: string | swc.Program;

    const swc_options: swc.Options = Object.assign(
      generateSwcOptions({
        baseUrl,
        classmap: this.classmap,
        filepath,
        timestamp,
        dev: this.dev,
      }),
      { filename: input, outputPath: output },
    );

    if (this.dev) {
      const { getTimestamp } = await import("./timestamp.ts");

      program = await swc.parseFile(input, {
        syntax: "typescript",
        tsx: true,
        decorators: true,
        comments: true,
        script: false,
        target: "esnext",
      });

      // deno-lint-ignore no-inner-declarations
      async function remap(node: swc.StringLiteral) {
        if (node.value.startsWith("/modules/")) {
          //! We should probably cache this
          const timestamp = await getTimestamp(node.value);
          if (timestamp) {
            node.value += `?t=${timestamp}`;
          }
          node.raw = node.value;
        }
      }

      // TODO: remap dynamic imports
      for (const node of program.body) {
        switch (node.type) {
          case "ExportNamedDeclaration": {
            if (node.source) {
              await remap(node.source);
            }
            break;
          }
          case "ExportAllDeclaration": {
            if (node.source) {
              await remap(node.source);
            }
            break;
          }
          case "ImportDeclaration": {
            if (node.source) {
              await remap(node.source);
            }
            break;
          }
        }
      }
    } else {
      program = await Deno.readTextFile(input);
    }

    let { code } = await swc.transform(program, swc_options);

    // FIX: We do a string replacement on the output code to manually catch the injected JSX
    // runtime specifiers because SWC doesn't natively support mapping `.js` suffixes here.
    code = code
      .replace(
        /from\s+["'](?:\/modules\/stdlib\/src\/expose|react)\/jsx-runtime["']/g,
        `from "/modules/stdlib/src/expose/jsx-runtime.js"`,
      )
      .replace(
        /from\s+["'](?:\/modules\/stdlib\/src\/expose|react)\/jsx-dev-runtime["']/g,
        `from "/modules/stdlib/src/expose/jsx-dev-runtime.js"`,
      );

    await ensureFile(output);
    await Deno.writeTextFile(output, code);
  }

  public async css(input: string, output: string, files: string[]) {
    function reformatClassmap(classmap: Mapping) {
      const reformattedEntries = Object.entries(classmap).map(([k, v]) => {
        if (typeof v === "object") {
          v = reformatClassmap(v);
        }
        return [k.replaceAll("_", "-"), v];
      });
      return Object.fromEntries(reformattedEntries);
    }

    const buffer = await Deno.readTextFile(input);
    const PostCSSProcessor = postcss.default([
      atImport(),
      tailwindcssNesting(),
      tailwindcss({
        config: {
          content: {
            relative: true,
            files,
          },
        },
      }),
      autoprefixer({}),
      postcssPluginRemapper({
        mapping: { MAP: reformatClassmap(this.classmap) },
      }),
    ]);
    const p = await PostCSSProcessor.process(buffer, { from: input });
    await ensureFile(output);
    await Deno.writeTextFile(output, p.css);
  }
}
