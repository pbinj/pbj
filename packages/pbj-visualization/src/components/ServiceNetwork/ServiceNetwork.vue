<script setup lang="ts">
import { Network } from "vis-network";
import { ref, shallowRef, onMounted, onUnmounted, watch } from "vue";
import {
  graphOptions,
  graphNodes,
  graphEdges,
  graphFilterNodeId,
  updateGraphDrawerData,
  toggleGraphDrawer,
} from "./graph";

const container = ref<HTMLDivElement>();
const networkRef = shallowRef<Network>();

function mountNetwork() {
  const node = container.value!;

  const network = (networkRef.value = new Network(
    node,
    {
      nodes: graphNodes,
      edges: graphEdges,
    },
    graphOptions.value,
  ));

  watch(
    graphOptions,
    (options) => {
      network.setOptions(options);
    },
    { immediate: true },
  );

  network.on("selectNode", (options) => {
    updateGraphDrawerData(options.nodes[0]);
    toggleGraphDrawer(true);
  });

  network.on("deselectNode", () => {
    toggleGraphDrawer(false);
  });

  watch(
    () => graphFilterNodeId.value,
    (id) => {
      if (id) network.moveTo({ position: { x: 0, y: 0 } });
    },
  );
}

onMounted(mountNetwork);

onUnmounted(() => {
  networkRef.value?.destroy();
});
</script>

<template>
   <v-card title="Network">
    <div class="graph-body">
      <div ref="container" class="absolute h-full w-full" />
    </div>
  </v-card>
</template>
<style>
.graph-body {
  height: 100%;
  width: 100%;
  position: relative;
  min-width: 500px;
  min-height: 800px;
}
.absolute {
  height: 100%;
  width: 100%;
  position: absolute;
}
</style>
