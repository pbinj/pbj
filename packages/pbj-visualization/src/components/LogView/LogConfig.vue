<script lang="ts" setup>
import type { LogLevel } from "@pbinj/pbj/logger";
import { levelToIcon } from "./logs.js";
import { ref, watch } from "vue";
import colors from "vuetify/util/colors";

const props = defineProps<{
  connected: boolean;
  level?: LogLevel;
  maxSize?: number;
  onConfig?: (conf: {
    search: string;
    level?: LogLevel;
    maxSize?: number;
  }) => void;
}>();

const levelRef = ref<keyof typeof levelToIcon>(props.level ?? "debug");
const searchText = ref("");
const maxSizeRef = ref(props.maxSize ?? 1000);

watch([levelRef, searchText, maxSizeRef], ([level, search, maxSize]) => {
  props.onConfig?.({ level, search, maxSize });
});
</script>

<template>
  <v-toolbar density="compact">
    <v-spacer></v-spacer>

    <v-text-field
      v-model="searchText"
      solo
      flat
      hide-details
      placeholder="Type keyword..."
    >
      <template v-slot:append-inner>
        <v-btn icon @click="searchText = ''" size="small">
          <v-icon>mdi-magnify</v-icon>
        </v-btn>
      </template>
    </v-text-field>

    <v-btn
      icon
      :title="props.connected ? 'Connected' : 'Disconnected'"
      size="small"
    >
      <v-icon :color="colors.blue.accent3" v-if="props.connected"
        >mdi-access-point</v-icon
      >
      <v-icon :color="colors.red.accent3" v-else>mdi-access-point-off</v-icon>
    </v-btn>
    <v-btn icon>
      <v-icon :color="levelToIcon[levelRef]?.color">{{
        levelToIcon[levelRef]?.icon
      }}</v-icon>
      <v-menu activator="parent">
        <v-list density="compact">
          <v-list-item
            v-bind:key="l"
            @click="levelRef = l as any"
            v-for="[l, entry] in Object.entries(levelToIcon)"
          >
            <v-list-item-title>
              <v-icon :color="entry.color">{{ entry.icon }}</v-icon>
              {{ entry.label }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-btn>
  </v-toolbar>
</template>
