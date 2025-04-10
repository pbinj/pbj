import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import vueDevTools from "vite-plugin-vue-devtools";
import vuetify from "vite-plugin-vuetify";
import { context } from "@pbinj/pbj";
import { register, serverConfigPBinJKey } from "./server/pbj.js";

export const CONFIG = {
  plugins: [vue(), vueJsx(), vueDevTools(), vuetify()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "./web",
  },
};
// https://vite.dev/config/
export default defineConfig(
  !process.env.DEV
    ? CONFIG
    : async () => {
        await register(context);
        const config = context.resolve(serverConfigPBinJKey);

        return {
          ...CONFIG,
          server: {
            proxy: {
              "/api/": {
                target: new URL(config?.url),
                changeOrigin: true,
              },
              "/socket.io": {
                target: new URL(config?.url),
                changeOrigin: true,
              },
            },
          },
        };
      },
);
