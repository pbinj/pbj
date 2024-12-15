<script setup lang="ts">
import { ServiceI } from "../types";
defineProps(['services']);


const headers= [
    { title: 'Name', key: 'name' },
    { title: 'Description', key: 'description' },
    { title: 'Dependencies', key: 'dependencies' },
    { title: 'Invoked', key: 'invoked' },
    { title: 'Invalid', key: 'invalid' },
    { title: 'Optional', key: 'optional' },
    { title: 'Tags', key: 'tags' },
    { title: 'Invokable', key: 'invokable' },
    { title: 'Cacheable', key: 'cacheable' },
    { title: 'Primitive', key: 'primitive' },
    { title: 'Is List', key: 'listOf' },
];
  
</script>

<template>
    <v-data-table-virtual
    :headers="headers"
    :items="services"
    height="400"
    item-value="name"
  ></v-data-table-virtual>
</template>

<style>

</style>