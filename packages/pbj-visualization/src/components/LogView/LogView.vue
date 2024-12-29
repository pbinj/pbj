<script lang="ts" setup>
import { ref } from "vue";
import type { LogLevel } from "@pbinj/pbj/logger";
import LogConfig from "./LogConfig.vue";
import { allLogs, connected, format, levels } from "./logs.js";
import LogList from "./LogList.vue";
import { watch } from "vue";

const maxSize = 1000;
const logs = ref(allLogs.value);
const logLevel = ref<LogLevel>("debug");
const search = ref<string>("");

watch(allLogs, () => {
  onConfig({ search: search.value, level: logLevel.value, maxSize });
});

function onConfig({
  search: text,
  level,
  maxSize = 1000,
}: {
  search: string;
  level?: LogLevel;
  maxSize?: number;
}) {
  let _logs = allLogs.value;
  if (text) {
    const re = new RegExp(text.replace(/([^.]\*)/g, ".+?"), "i");
    _logs = _logs.filter((log) => re.test(format(log.message, log.context)));
  }
  const levelIndex = level ? levels.indexOf(level) : 0;
  if (levelIndex === -1) {
    throw new Error(`Invalid log level: ${level}`);
  }
  if (level !== "debug") {
    _logs = _logs.filter((log) => levels.indexOf(log.level) >= levelIndex);
  }
  _logs = _logs.slice(0, maxSize);
  logLevel.value = level ?? "debug";
  search.value = text;
  logs.value = _logs;
}
</script>

<template>
  <v-card class="log-container">
    <LogConfig :connected="connected" :onConfig="onConfig" />

    <LogList :logs="logs">
      <template v-slot:nologs>
        No logs found

        <span v-if="!connected">(not connected) <v-btn icon></v-btn></span>
        <span v-else-if="search != ''">Try clearing search bar</span>
        <span v-else-if="logLevel !== 'debug'"
          >(level is '{{ logLevel }}' try changing to debug)</span
        >
        <span v-else>No log messages found.</span>
      </template>
    </LogList>
  </v-card>
</template>

<style scoped>
.log-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 500px;
  min-height: 800px;
}
</style>
