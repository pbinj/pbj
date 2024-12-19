import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import vueDevTools from "vite-plugin-vue-devtools";
import vuetify from "vite-plugin-vuetify";
import tsConfigPaths from "vite-tsconfig-paths";
import { context } from "@pbinj/pbj";
import { register, serverConfigPBinJKey } from "./server/pbj.js";
await register(context);
const config = context.resolve(serverConfigPBinJKey);
// https://vite.dev/config/
export default defineConfig({
  plugins: [tsConfigPaths(), vue(), vueJsx(), vueDevTools(), vuetify()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "./web",
  },
  server: {
    proxy: {
      "/api/": {
        target: config.url,
        changeOrigin: true,
      }
    },
  },
});
