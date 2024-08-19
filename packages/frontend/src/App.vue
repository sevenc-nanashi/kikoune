<script setup lang="ts">
import { TooltipProvider } from "radix-vue"
import { useStore } from "./store"
import LoginView from "./views/LoginView.vue"
import MainView from "./views/MainView.vue"
import ErrorView from "./views/ErrorView.vue"

const store = useStore()
</script>

<template>
  <TooltipProvider :delay-duration="250">
    <LoginView
      class="transition-opacity absolute inset-0 duration-1000"
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
