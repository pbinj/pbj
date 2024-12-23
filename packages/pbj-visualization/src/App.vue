<script setup lang="ts">
import { ref } from "vue";
import ServiceTable from "./components/ServiceTable.vue";
import ServiceDrawer from "./components/ServiceDrawer.vue";
import {
  ServiceNetwork,
  graphDrawerData,
  graphDrawerShow,
  parseGraphRawData,
} from "./components/ServiceNetwork";
import type { ServiceI } from "./types";
import { useRoute } from "vue-router";

const route = useRoute();
const loading = ref(false);
const error = ref<string | null>(null);
const services = ref([] as ServiceI[]);
const view = ref<"network" | "table">(
  (route.name as "network" | "table") || "network",
);

// watch the params of the route to fetch the data again
//watch(fetchData, { immediate: true })

async function fetchData() {
  error.value = null;
  loading.value = true;
  try {
    const resp = (services.value = await (await fetch("/api/services")).json());
    parseGraphRawData(resp);
  } catch (err) {
    error.value = String(err);
  } finally {
    loading.value = false;
  }
}

fetchData();
</script>

<template>
  <v-app full-height full-width>
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
        </v-btn-toggle>
        <v-btn @click="fetchData">
          <v-icon icon="mdi-refresh" size="large" />
        </v-btn>
      </template>
    </v-app-bar>

    <ServiceDrawer :service="graphDrawerData?.service" v-if="graphDrawerShow" />

    <v-main min-width="100%" class="">
      <v-container>
        <div v-if="loading">
          <v-skeleton-loader
            :type="view == 'network' ? 'image' : view"
          ></v-skeleton-loader>
        </div>
        <div v-if="error">Error: {{ error }}</div>
        <div v-if="!loading">
          <ServiceNetwork :services="services" v-if="view === 'network'" />
          <ServiceTable :services="services" v-if="view === 'table'" />
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
v-app {
  --v-theme-info: red;
}
.button-group {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
  gap: 10px;
}
</style>
