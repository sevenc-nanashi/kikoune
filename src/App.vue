<script setup lang="ts">
import { computed } from "vue"
import { useStore } from "./store"
import LoginView from "./views/LoginView.vue"
import MainView from "./views/MainView.vue"

const store = useStore()
const isReady = computed(() => {
  return !!store._token
})
</script>

<template>
  <MainView v-if="isReady" />
  <LoginView v-else />
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
