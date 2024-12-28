<script lang="tsx" setup>
import type { LogLevel } from '@pbinj/pbj/logger';
import { ref , watch} from 'vue';
import colors from "vuetify/util/colors";
import io from "socket.io-client";
import { connect } from './logs.js';

const props = defineProps<{
    connected: boolean,
}>();

</script>

<template>
      <v-btn @onClick="connect" icon :title="props.connected ? 'Connected' : 'Disconnected'" size="small" >
             <v-icon :color="colors.blue.accent3" v-if="props.connected">mdi-access-point</v-icon>
             <v-icon :color="colors.red.accent3" v-else>mdi-access-point-off</v-icon>
      </v-btn>
 </template>