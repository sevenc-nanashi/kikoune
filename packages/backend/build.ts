import fs from "node:fs/promises";
import { rolldown } from "rolldown";

console.log("Building...");
const bundle = await rolldown({
  input: `${import.meta.dirname}/src/index.ts`,
  platform: "node",
});

await bundle.write({
  file: `${import.meta.dirname}/dist/index.bundle.js`,
  inlineDynamicImports: true,
  format: "es",
});

await fs.mkdir(`${import.meta.dirname}/../../dist`, { recursive: true });

await fs.copyFile(
  `${import.meta.dirname}/dist/index.bundle.js`,
  `${import.meta.dirname}/../../dist/index.js`,
);
console.log("Build complete");
