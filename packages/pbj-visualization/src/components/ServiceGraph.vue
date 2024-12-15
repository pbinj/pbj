<script lang="ts" setup>

import * as vNG from "v-network-graph"
import * as d3 from "d3"
import 'd3-force';
import {
  ForceLayout,
  ForceNodeDatum,
  ForceEdgeDatum,
} from "v-network-graph/lib/force-layout"
import type { ServiceI } from "../types";
import { ref } from 'vue';

const props = defineProps(['services']);


const configs = 
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

  

const nodes = {};
const edges = {};
    for (const value of props.services ) {
      nodes[value.name] = value;
      for (const dep of value.dependencies) {
        edges[`${value.name}:${dep}`] = { source: value.name, target: dep };
      }
}
</script>

<template>
  <v-network-graph
              class="graph"
              :nodes="nodes"
              :edges="edges"
              :configs="configs"
            />
</template>


<style>
.graph {
  display: flex;
  flex:1;
  justify-content: center;
  align-items: center;
  min-width: 800px;
  min-height: 600px;
  height: 100%;
  width: 100%;
}
.graph svg {
    height: 100%;
    width: 100%;
    min-height: 800px;
}
</style> 