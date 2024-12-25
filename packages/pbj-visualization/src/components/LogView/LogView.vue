<script lang="tsx" setup>
import { io } from "socket.io-client";
import { ref } from "vue";
import type { LogMessage } from "@pbinj/pbj/logger";
const socket = io({ path: '/socket.io' });
const maxSize = 1000;
const logs = ref([] as LogMessage[]);
const connected = ref(false);
socket.on('connect', () => {
    connected.value = true;
});
socket.on('disconnect', () => {
    connected.value = false;
});
socket.on('log', (data) => {
   logs.value = [...logs.value, ...data].slice(-maxSize);
});

</script>

<template>
 <v-card class="log-container" title="Logs">
  <div class="log-header"> 
    <span>Messages</span>
    <div>
    <span v-if="!connected">
         <v-icon
            color="red-darken-2"
            icon="mdi-alert-circle"
            size="small"/> Disconnected</span>
    <span v-if="connected">
          <v-icon
      color="green-darken-2"
      icon="mdi-atenna"
      size="small"/> Connected ({{ logs.length }})
    </span>
    </div>
  </div>
    
  <code class="log-view">
    <pre class="log-line" v-for="log in logs">
        <span class="log-level">{{ log.level }}</span> 
        <span class="log-timestamp" :title="log.timestamp + ''">{{ new Date(log.timestamp).toISOString()}}</span>
        <span class="log-name">{{ log.name }}</span>
        <span class="log-message">{{ log.message }}</span>
    </pre>
  </code>
</v-card>
</template>

<style scoped>
.log-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
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
.log-view {
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
