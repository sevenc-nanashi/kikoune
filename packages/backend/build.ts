// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// https://github.com/rollup/plugins/issues/1662
import fs from "fs/promises"
import { rollup } from "rollup"
import typescript from "@rollup/plugin-typescript"
import nodeResolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"

console.log("Building...")
const bundle = await rollup({
  input: `${import.meta.dirname}/src/index.ts`,
  plugins: [
    typescript(),
    nodeResolve({
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
  ],
})

await bundle.write({
  file: `${import.meta.dirname}/dist/index.bundle.js`,
  format: "es",
})

await fs.copyFile(
  `${import.meta.dirname}/dist/index.bundle.js`,
  `${import.meta.dirname}/../../dist/index.js`
)
console.log("Build complete")
