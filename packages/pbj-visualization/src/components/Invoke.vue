<script setup lang="ts">
import { type ServiceI } from "../types";
import { ref } from "vue";
const props = defineProps(["service"]);
let service = props.sevice as ServiceI;
let invoked = ref(false);
let busy = ref(false);
let resp = ref("");
function invoke() {
  busy.value = true;
  fetch("/api/invoke", {
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
    },
    () => {
      busy.value = false;
      invoked.value = false;
      resp.value = "Error invoking service";
    }
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
    >
      Invoke
    </v-btn>
    <div v-if="busy">
      <v-progress-circular color="primary" indeterminate></v-progress-circular>
    </div>
    <div v-if="invoked">
      <code>{{ resp }}</code>
    </div>
  </div>
</template>
