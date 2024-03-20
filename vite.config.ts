import childProcess from "child_process"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const currentCommit = childProcess
    .execSync("git rev-parse --short HEAD")
    .toString()
    .trim()

  process.env.VITE_COMMIT = currentCommit
  return {
    plugins: [vue()],
    server: {
      port: 1103,
    },
    resolve: {
      alias: {
        "~": "/src",
        "~shared": "/src-shared",
      },
    },
  }
})
