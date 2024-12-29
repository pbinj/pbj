<script lang="ts" setup>
import type { LogMessage } from "@pbinj/pbj/logger";
import { openDrawer } from "../ServiceNetwork/graph.js";
import { toParts } from "./logs.js";

const props = defineProps<{ log: LogMessage }>();

const parts = toParts(props.log.message);
//eslint-disable-next-line  @typescript-eslint/no-explicit-any
const context = props.log.context as any;
</script>

<template>
  <span
    class="log-row-message"
    v-bind:key="index"
    v-for="(part, index) in parts"
  >
    <span v-if="index % 2 === 0">
      {{ part }}
    </span>
    <span v-else-if="part.toLowerCase().endsWith('key')">
      <v-chip
        color="primary"
        size="x-small"
        @click="openDrawer(context[part])"
        >{{ context[part] ?? "unknown" }}</v-chip
      >
    </span>
    <span v-else class="log-row-message-unknown">
      {{ context[part] }}
    </span>
  </span>
</template>
<style scoped>
.log-row-message-unknown {
  color: rgb(60, 0, 255);
}
</style>
