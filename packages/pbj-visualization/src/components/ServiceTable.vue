<script setup lang="ts">
import { openDrawer } from "./ServiceNetwork/graph";
import { type ServiceI } from "../types";
import { reactive } from 'vue';
const props = defineProps(["services"]);

const headers = [
  { title: "Name", key: "name", sortable: true, },
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


let search = "";
</script>

<template>
  <v-card>
    <title>Services</title>
    <v-data-table
      :headers="headers"
      :items="services"
      :search="search"
      height="400px"
      item-value="name"
    >

    <template v-slot:item.name="{value}" >
      <v-list-item-action
        @click="openDrawer(value)"
      >{{ value }}</v-list-item-action>
    </template>
    <template v-slot:item.dependencies="{value}" >
      <v-list>
        <v-list-item-action
          @click="openDrawer(dep)"
        v-for="dep in value" :key="dep"
        >{{ dep }}</v-list-item-action>
     </v-list>
     </template>
  </v-data-table>
  </v-card>
</template>

<style></style>
