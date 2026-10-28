// Copies pdf.js's web worker into public/, so the browser can load it from
// /pdf.worker.min.mjs. Runs after `npm install` (see package.json).
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const pdfjsDir = dirname(require.resolve("pdfjs-dist/package.json"));

mkdirSync("public", { recursive: true });
copyFileSync(
  join(pdfjsDir, "build", "pdf.worker.min.mjs"),
  join("public", "pdf.worker.min.mjs"),
);
