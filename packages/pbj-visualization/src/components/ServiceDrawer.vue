<script setup lang="ts">
import Invoke from "./InvokeButton.vue";
import { closeDrawer } from "./ServiceNetwork/graph";
import LogList from "./LogView/LogList.vue";
import { allLogs } from "./LogView/logs.js";
import { type ServiceI } from "../types";

const props = defineProps<{ service: ServiceI }>();
</script>

<template>
  <v-navigation-drawer location="right">
    <v-list>
      <v-list-item
        :title="props.service?.name"
        :subtitle="props.service.description"
      >
        <v-btn
          class="close"
          icon="mdi-close"
          size="x-small"
          @click="closeDrawer"
        ></v-btn>
      </v-list-item>
      <v-divider></v-divider>
      <v-list-item link title="Dependencies">
        {{ props.service.dependencies }}
      </v-list-item>
      <v-list-item title="Invalid">{{ props.service.invalid }}</v-list-item>
      <v-list-item title="Tags">{{ props.service.tags }}</v-list-item>
      <v-list-item title="Invokable">{{ props.service.invokable }}</v-list-item>
      <v-list-item title="Cacheable">{{ props.service.cacheable }}</v-list-item>
      <v-list-item title="Primitive">{{ props.service.primitive }}</v-list-item>
      <v-list-item title="List">{{ props.service.listOf }}</v-list-item>
      <v-list-item>
        <Invoke :service="props.service" />
      </v-list-item>
      <v-list-item>
        <Invoke
          :service="props.service"
          endpoint="/api/invalidate"
          label="Invalidate"
        />
      </v-list-item>
      <v-list-item title="Logs">
        <LogList :logs="allLogs.filter((v) => v.name === props.service.name)" />
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
<style>
.close {
  position: absolute;
  right: 0;
  top: 0;
}
</style>
