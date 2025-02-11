// import builtins from "rollup-plugin-node-builtins";
import { readFile } from "fs/promises";
import { builtinModules } from "module";
import { polyfillPath, polyfillGlobals } from "modern-node-polyfills";
import { Plugin, transform } from "esbuild";
import { dirname } from "path";

const isTS = (filename: string): boolean => /\.[cm]?ts$/.test(filename);

export const plugin: Plugin = {
  name: "vite-plugin-cloudflare",
  async setup(build) {
    build.onResolve({ filter: /.*/ }, async ({ path }) => {
      if (builtinModules.includes(path)) {
        return { path: await polyfillPath(path), sideEffects: false };
      }
    });

    build.onLoad({ filter: /\.[cm]?[jt]s$/ }, async ({ path }) => {
      const isTSFile = isTS(path);
      let code = await readFile(path, "utf8");
      if (isTSFile) {
        code = (await transform(code, {
          loader: "ts",
        })).code;
      }
      return {
        contents: await polyfillGlobals(code, {
          __dirname: dirname(path),
          __filename: path,
        }),
        loader: isTSFile ? "ts" : "js",
      };
    });
  },
};
