import colors from "vuetify/util/colors";
import type { LogMessage } from "@pbinj/pbj/logger";
import { io } from "socket.io-client";
import { ref } from "vue";

export const levels = ["debug", "info", "warn", "error"] as const;
export const allLogs = ref([] as LogMessage[]);
export const connected = ref(false);

const socket = io({ path: "/socket.io" });
export function connect() {
  socket.connect();
}
socket.on("connect", () => {
  connected.value = true;
});

socket.on("disconnect", () => {
  connected.value = false;
});

socket.on("log", (data) => {
  allLogs.value = [...allLogs.value, ...data];
});

export function toParts(fmt: string) {
  return fmt.split(/{([^}]+)}/g);
}

export function format(fmt: string, obj: unknown) {
  return fmt.replace(/{([^}]+)}/g, (match, key) => {
    //eslint-disable-next-line  @typescript-eslint/no-explicit-any
    return (obj as any)[key] ?? match;
  });
}

export const levelToIcon = {
  debug: {
    icon: "mdi-bug-outline",
    color: colors.green.accent3,
    label: "Debug",
  },
  info: {
    icon: "mdi-information-slab-circle-outline",
    color: colors.green.accent1,
    label: "Info",
  },
  warn: {
    icon: "mdi-alert-box-outline",
    color: colors.orange.accent3,
    label: "Warn",
  },
  error: {
    icon: "mdi-alert-octagram",
    color: colors.red.accent3,
    label: "Error",
  },
} as const;
