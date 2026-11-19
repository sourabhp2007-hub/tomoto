// dist contains generated artifacts from both current and previous build layouts.
import { rm } from "node:fs/promises";
await rm(new URL("../dist/", import.meta.url), {
  recursive: true,
  force: true,
});
