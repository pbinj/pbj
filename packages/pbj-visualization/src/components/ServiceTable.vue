<script setup lang="ts">
import { openDrawer } from "./ServiceNetwork/graph";

const props = defineProps(["services"]);

const headers = [
  { title: "Name", key: "name", sortable: true },
  { title: "Description", key: "description" },
  { title: "Dependencies", key: "dependencies" },
  // { title: "Invoked", key: "invoked" },
  // { title: "Invalid", key: "invalid" },
  // { title: "Optional", key: "optional" },
  // { title: "Tags", key: "tags" },
  // { title: "Invokable", key: "invokable" },
  // { title: "Cacheable", key: "cacheable" },
  // { title: "Primitive", key: "primitive" },
  // { title: "Is List", key: "listOf" },
];

const search = "";
</script>

<template>
  <v-card>
    <title>Services</title>
    <v-data-table-virtual
      :headers="headers"
      :items="props.services"
      :search="search"
      height="400px"
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
