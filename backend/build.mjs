// Bundles the API for deployment. @app/shared ships TypeScript source, which
// Node can't load from node_modules at runtime, so it is inlined into the
// bundle. Every other dependency stays external and is installed as usual.
//
// The output is server.js because Vercel picks the entrypoint by file name
// (src/app, src/index, src/server, then app, index, server). The source entry
// is src/main.ts, which is not on that list, so Vercel runs this bundle.
import { readFileSync } from "node:fs";
import { build } from "esbuild";

const { dependencies } = JSON.parse(readFileSync("package.json", "utf8"));

await build({
  entryPoints: ["src/main.ts"],
  outfile: "server.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  sourcemap: true,
  external: Object.keys(dependencies).filter((name) => name !== "@app/shared"),
});
