<script setup lang="ts">

import { reactive, ref, watch } from "vue"
import * as vNG from "v-network-graph"
import * as d3 from "d3"
import 'd3-force';
import {
  ForceLayout,
  ForceNodeDatum,
  ForceEdgeDatum,
} from "v-network-graph/lib/force-layout"
import ServiceTable from "./components/ServiceTable.vue"
import ServiceGraph from "./components/ServiceGraph.vue"

const View = ["network", "table"] as const;
const configs = reactive(
  vNG.defineConfigs({
    view: {
      scalingObjects: true,
      minZoomLevel: 0.1,
      maxZoomLevel: 16,
         layoutHandler: new ForceLayout({
        positionFixedByDrag: false,
        positionFixedByClickWithAltKey: true,
        createSimulation: (d3, nodes, edges) => {
          // d3-force parameters
          const forceLink = d3.forceLink<ForceNodeDatum, ForceEdgeDatum>(edges).id(d => d.id)
          return d3
            .forceSimulation(nodes)
            .force("edge", forceLink.distance(40).strength(0.5))
            .force("charge", d3.forceManyBody().strength(-800))
            .force("center", d3.forceCenter().strength(0.05))
            .alphaMin(0.001)

            // * The following are the default parameters for the simulation.
            // const forceLink = d3.forceLink<ForceNodeDatum, ForceEdgeDatum>(edges).id(d => d.id)
            // return d3
            //   .forceSimulation(nodes)
            //   .force("edge", forceLink.distance(100))
            //   .force("charge", d3.forceManyBody())
            //   .force("collide", d3.forceCollide(50).strength(0.2))
            //   .force("center", d3.forceCenter().strength(0.05))
            //   .alphaMin(0.001)
        }
      }),

    },
    
  })
)

  

const loading = ref(false)
const error = ref(null)
const services = ref([] as ServiceI[])
const view = ref(0);
// watch the params of the route to fetch the data again
//watch(fetchData, { immediate: true })

async function fetchData() {
  console.log('fetching data');
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