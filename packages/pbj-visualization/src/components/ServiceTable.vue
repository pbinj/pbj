<script setup lang="ts">
import { openDrawer } from "./ServiceNetwork/graph";

const props = defineProps(["services"]);

const headers = [
  { title: "Name", key: "name", sortable: true },
  { title: "Description", key: "description" },
  { title: "Dependencies", key: "dependencies" },
];

const search = "";
</script>

<template>
  <v-card title="Services">
    <v-data-table-virtual
      :headers="headers"
      :items="props.services"
      :search="search"
      height="100%"
      item-value="name"
    >
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.name="{ value }">
        <v-list-item-action @click="openDrawer(value)">{{
          value
        }}</v-list-item-action>
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.dependencies="{ value }">
        <v-list>
          <v-list-item-action
            @click="openDrawer(dep)"
            v-for="dep in value"
            :key="dep"
            >{{ dep }}</v-list-item-action
          >
        </v-list>
      </template>
    </v-data-table-virtual>
  </v-card>
</template>

<style></style>
