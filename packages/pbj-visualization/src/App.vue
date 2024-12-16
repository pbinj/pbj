<script setup lang="ts">

import { reactive, ref, watch } from "vue";
import ServiceTable from "./components/ServiceTable.vue";
import ServiceGraph from "./components/ServiceGraph.vue";
import type { ServiceI } from "./types";

const View = ["network", "table"] as const;


  

const loading = ref(false)
const error = ref<string | null>(null)
const services = ref([] as ServiceI[])
const view = ref(0);
// watch the params of the route to fetch the data again
//watch(fetchData, { immediate: true })

async function fetchData() {
  error.value = null;
  loading.value = true
  try {
    services.value = await (await fetch('/api/services')).json();
  } catch (err) {
    error.value = String(err);
  } finally {
    loading.value = false
  }
}


fetchData();
</script>


<template>
  <v-responsive class="border rounded" min-height="700">
    <v-app>
      <v-app-bar         color="info"
title="PBinJ Visualization">

 <template v-slot:append>
     

        <v-btn-toggle v-model="view" mandatory>
    <v-btn >
      <v-icon icon="mdi-graph-outline" size="small"/>Network</v-btn>
    <v-btn >
      <v-icon icon="mdi-table" size="small"/>
      Table</v-btn>
        </v-btn-toggle>
         <v-btn @click="fetchData">
      <v-icon icon="mdi-refresh" size="large"/>
    </v-btn>
        </template>
  </v-app-bar>
  <v-main min-width="100%">
        <v-container>
          <div v-if="loading"><v-skeleton-loader :type="view == 0 ? 'image' : 'table'"></v-skeleton-loader></div>
          <div v-if="error">Error: {{ error }}</div>
          <div v-if="!loading">
              <ServiceGraph :services="services" v-if="View[view] === 'network'"/>
              <ServiceTable :services="services" v-if="View[view] === 'table'"/>
              </div>
        </v-container>
      </v-main>
    </v-app>
  </v-responsive>
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