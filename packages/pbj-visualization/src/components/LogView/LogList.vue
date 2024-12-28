<script lang="ts" setup>
import LogMessageVue from "./LogMessage.vue";
import type { LogMessage } from "@pbinj/pbj/logger";
import { levelToIcon } from "./logs.js";
import { ref } from "vue";

const props = defineProps<{
  logs: LogMessage[];
}>();

const info = ref(levelToIcon.info.color);
const debug = ref(levelToIcon.debug.color);
const warn = ref(levelToIcon.warn.color);
const error = ref(levelToIcon.error.color);
</script>
<template>
  <code class="logs">
    <pre class="log-line" v-for="log in props.logs" :key="log.id">
        <span :class="'log-level '+log.level">{{ log.level }}</span> 
        <span class="log-timestamp" :title="log.timestamp + ''">{{ new Date(log.timestamp).toISOString()}}</span>
        <span class="log-name">{{ log.name }}</span>
        <LogMessageVue :log="log"/>
    </pre>
    <pre class="log-line" v-if="props.logs.length === 0">
      <slot name="nologs">No Logs</slot>
    </pre>
  </code>
</template>

<style scoped>
.info {
  background: v-bind(info);
}
.warn {
  background: v-bind(warn);
}
.error {
  background: v-bind(error);
}
.debug {
  background: v-bind(debug);
}
.log-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.log-level {
  padding: 2px 5px;
  border-radius: 3px;
  width: 7ch;
  text-align: center;
  display: inline-block;
}

.log-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 500px;
  min-height: 800px;
}

.logs {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: auto;
}
.log-line {
  width: 100%;
  font-size: 10px;
  white-space: nowrap;
  border-bottom: 1px solid #ccc;
}
</style>
