<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import ServiceTable from "./components/ServiceTable.vue";
import ServiceDrawer from "./components/ServiceDrawer.vue";
import {
  ServiceNetwork,
  graphDrawerData,
  graphDrawerShow,
} from "./components/ServiceNetwork";
import { useRoute } from "vue-router";
import {
  fetchServiceData,
  graphLoading,
  services,
} from "./components/ServiceNetwork/graph";
import LogView from "./components/LogView/LogView.vue";

const route = useRoute();
const route = useRoute();
const error = ref<string | null>(null);
const view = ref<"network" | "table" | "logs">(
  (route.name as "network" | "table" | "logs") || "network",
);

// watch the params of the route to fetch the data again
//watch(fetchData, { immediate: true })
fetchServiceData().catch((e) => {
  error.value = String(e);
  console.error(e);
});
</script>

<template>
  <v-app full-height full-width class="app">
    <v-app-bar color="info" title="PBinJ Visualization">
      <template v-slot:append>
        <v-btn-toggle v-model="view" mandatory>
          <v-btn value="network" to="/network">
            <v-icon icon="mdi-graph-outline" size="small" />Network</v-btn
          >
          <v-btn value="table" to="/table">
            <v-icon icon="mdi-table" size="small" />
            Table</v-btn
          >
          <v-btn value="logs" to="/logs">
            <v-icon icon="mdi-text" size="small" />
            Log</v-btn
          >
        </v-btn-toggle>
        <v-btn @click="fetchServiceData">
          <v-icon icon="mdi-refresh" size="large" />
        </v-btn>
      </template>
    </v-app-bar>

    <ServiceDrawer
      :service="graphDrawerData.service"
      v-if="graphDrawerShow && graphDrawerData?.service"
    />

    <v-main min-width="100%" class="main">
      <v-container>
        <div v-if="graphLoading">
          <v-skeleton-loader
            :type="view == 'network' ? 'image' : 'table'"
          ></v-skeleton-loader>
        </div>
        <div v-else-if="error">Error: {{ error }}</div>
        <div v-else>
          <ServiceNetwork :services="services" v-if="view === 'network'" />
          <ServiceTable :services="services" v-if="view === 'table'" />
          <LogView v-if="view === 'logs'" />
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped></style>
