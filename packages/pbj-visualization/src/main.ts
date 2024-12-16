// Vuetify
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import "./assets/main.css";
import VNetworkGraph from "v-network-graph";
import "v-network-graph/lib/style.css";
import { createApp } from "vue";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import colors from "vuetify/util/colors";

import App from "./App.vue";
import router from "./router";

export function main(app = createApp(App)) {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      themes: {
        light: {
          colors: {
            info: colors.purple.accent3,
          },
        },
      },
    },
  });

  app.use(VNetworkGraph);
  app.use(createPinia());
  app.use(vuetify);
  app.use(router);
  app.mount("#app");
  return { app, router };
}
main();
