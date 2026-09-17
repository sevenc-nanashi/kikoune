import vize from "@vizejs/vite-plugin";
import { defineConfig } from "vite";
import svgLoader from "vite-svg-loader";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/kikoune/",
  plugins: [
    vize({ customElements: ["budoux-*"] }),
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
  resolve: {
    alias: {
      "~": "/src",
    },
  },
});
