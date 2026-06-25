import { copyFile, mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(".");
const outDir = join(root, "dist");
const files = [
  "index.html",
  "app.js",
  "styles.css",
  "manifest.webmanifest",
  "service-worker.js",
  "icons/afterlife-icon.svg"
];

await rm(outDir, { recursive: true, force: true });
await mkdir(join(outDir, "icons"), { recursive: true });

await Promise.all(
  files.map((file) => copyFile(join(root, file), join(outDir, file)))
);

console.log(`Built ${files.length} files to dist/`);
