import childProcess from "child_process"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const currentCommit = childProcess
    .execSync("git rev-parse HEAD")
    .toString()
    .trim()

  process.env.VITE_COMMIT = currentCommit
  return {
    plugins: [vue()],
    server: {
      headers: {
        "Content-Security-Policy":
          "frame-src 'self' https://embed.nicovideo.jp/",
      },
      port: 1103,
    },
    resolve: {
      alias: {
        "~": "/src",
        "~types": "/types",
      },
    },
  }
})
