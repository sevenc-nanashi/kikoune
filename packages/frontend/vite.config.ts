import childProcess from "child_process"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import svgLoader from "vite-svg-loader"

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const currentCommit = childProcess
    .execSync("git rev-parse --short HEAD")
    .toString()
    .trim()

  process.env.VITE_COMMIT = currentCommit
  return {
    build: {
      outDir: `../../dist/frontend`,
    },
    plugins: [
      vue(),
      svgLoader({
        svgoConfig: {
          multipass: true,
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  removeViewBox: false,
                },
              },
            },
          ],
        },
      }),
    ],
    server: {
      port: 1103,
      proxy: {
        "/api": {
          target: "http://localhost:1104",
          changeOrigin: true,
        },
        "/nico": {
          target: "http://localhost:1104",
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 1103,
    },
    resolve: {
      alias: {
        "~": "/src",
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        },
      },
    },
  }
})
