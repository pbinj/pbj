<script setup lang="ts">
import { ref } from "vue";
import { fetchServiceData } from "./ServiceNetwork/graph";
const props = defineProps(["service", "label", "endpoint"]);
const endpoint = props.endpoint ?? "/api/invoke";
const label = props.label ?? "Invoke";
const invoked = ref(false);
const busy = ref(false);
const resp = ref("");
function invoke() {
  busy.value = true;
  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: props.service.name }),
  }).then(
    async (v) => {
      const data = await v.json();
      resp.value = JSON.stringify(data, null, 2);
      invoked.value = true;
      busy.value = false;
      return fetchServiceData();
    },
    () => {
      busy.value = false;
      invoked.value = false;
      resp.value = "Error invoking service";
    },
  );
}
</script>

<template>
  <div>
    <v-btn
      @click="invoke"
      :disabled="busy"
      :loading="busy"
      :color="invoked ? 'success' : 'primary'"
      size="x-small"
    >
      {{ label }}
    </v-btn>
    <div v-if="busy">
      <v-progress-circular color="primary" indeterminate></v-progress-circular>
    </div>
    <div v-if="invoked">
      <code>{{ resp }}</code>
    </div>
  </div>
</template>
