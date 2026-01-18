import vue from "@vitejs/plugin-vue";
import childProcess from "child_process";
import unocss from "unocss/vite";
import { defineConfig, UserConfig } from "vite";
import { consoleForwardPlugin } from "vite-console-forward-plugin";
import svgLoader from "vite-svg-loader";

// https://vitejs.dev/config/
export default defineConfig(async (): Promise<UserConfig> => {
  const currentCommit = childProcess.execSync("git rev-parse --short HEAD").toString().trim();

  process.env.VITE_COMMIT = currentCommit;
  return {
    build: {
      outDir: `../../dist/frontend`,
      rolldownOptions: {
        transform: {
          target: ["chrome111", "edge111", "firefox114", "safari16.4"],
        },
      },
    },
    plugins: [
      unocss(),
      consoleForwardPlugin(),
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith("budoux-"),
          },
        },
      }),
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
      allowedHosts: true,
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
  };
});
