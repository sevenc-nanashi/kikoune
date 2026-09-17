<script setup lang="ts">
import consola from "consola/browser";
import { TooltipProvider } from "radix-vue";
import { onMounted, onUnmounted } from "vue";

import { useDiscordSdk } from "./plugins/useDiscordSdk";
import { useStore } from "./store";
import ErrorView from "./views/ErrorView.vue";
import LoginView from "./views/LoginView.vue";
import MainView from "./views/MainView.vue";

const log = consola.withTag("root");

const store = useStore();
const discordSdk = useDiscordSdk();

const onLayoutUpdate = (event: { layout_mode: -1 | 0 | 1 | 2 }) => {
  log.info("Layout mode update received:", event.layout_mode);
  let layout: "focused" | "pip" | "grid" | "unhandled" = "unhandled";
  switch (event.layout_mode) {
    case -1:
      layout = "unhandled";
      break;
    case 0:
      layout = "focused";
      break;
    case 1:
      layout = "pip";
      break;
    case 2:
      layout = "grid";
      break;
  }
  document.body.setAttribute("data-layout", layout);
};
onMounted(async () => {
  await discordSdk.ready();
  discordSdk.subscribe("ACTIVITY_LAYOUT_MODE_UPDATE", onLayoutUpdate);
});
onUnmounted(() => {
  discordSdk.unsubscribe("ACTIVITY_LAYOUT_MODE_UPDATE", onLayoutUpdate);
});
</script>

<template>
  <TooltipProvider :delay-duration="250">
    <LoginView
      un-transition-opacity
      un-absolute
      un-inset="0"
      un-duration="1000"
      :style="{
        opacity: store.$state.view === 'login' ? 1 : 0,
        pointerEvents: store.$state.view === 'login' ? 'auto' : 'none',
      }"
    />
    <MainView v-if="store.$state.view === 'main'" />
    <ErrorView v-else-if="store.$state.view === 'error'" />
  </TooltipProvider>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
