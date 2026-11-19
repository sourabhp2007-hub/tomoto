import { build } from "esbuild";
import { readdir, readFile, mkdir, copyFile } from "node:fs/promises";
import { extname } from "node:path";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};
const files = {};
async function walk(prefix = "") {
  for (const f of await readdir("dist/client" + prefix, {
    withFileTypes: true,
  })) {
    const path = prefix + "/" + f.name;
    if (f.isDirectory()) await walk(path);
    else
      files[path] = {
        type: types[extname(path)] || "application/octet-stream",
        body: (await readFile("dist/client" + path)).toString("base64"),
      };
  }
}
await walk();
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await copyFile(".openai/hosting.json", "dist/.openai/hosting.json");
await build({
  entryPoints: ["server/worker.js"],
  outfile: "dist/server/index.js",
  format: "esm",
  bundle: true,
  minify: true,
  target: "es2022",
  plugins: [
    {
      name: "assets",
      setup(b) {
        b.onResolve({ filter: /^virtual:tomato-assets$/ }, () => ({
          path: "assets",
          namespace: "embedded",
        }));
        b.onLoad({ filter: /.*/, namespace: "embedded" }, () => ({
          contents: "export const files=" + JSON.stringify(files),
        }));
      },
    },
  ],
});
