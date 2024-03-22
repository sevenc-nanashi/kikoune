<script setup lang="ts">
import { ref } from "vue"
import QueueList from "./QueueList.vue"
import UserList from "./UserList.vue"
import AboutThis from "./AboutThis.vue"

const tabs = {
  main: "md-home",
  queue: "md-queuemusic",
  users: "md-people",
  about: "md-info",
} as const
const tabNames = {
  main: "ホーム",
  queue: "キュー",
  users: "ユーザー",
  about: "このアプリについて",
} as const

const selectedTab = ref<keyof typeof tabs>("main")
const changeTab = () => {
  const keys = Object.keys(tabs) as (keyof typeof tabs)[]
  const currentIndex = keys.indexOf(selectedTab.value)
  const nextIndex = (currentIndex + 1) % keys.length
  selectedTab.value = keys[nextIndex]
}
</script>
<template>
  <div
    class="absolute inset-0 z-40 hidden flex-col"
    :class="{
      'xs:max-sm:flex': selectedTab !== 'main',
    }"
  >
    <div
      class="w-full relative flex bg-black p-2 font-bold text-2xl flex-row items-end justify-start"
    >
      {{ tabNames[selectedTab] }}
    </div>
    <div class="flex-grow relative w-full bg-black/75">
      <QueueList v-if="selectedTab === 'queue'" />
      <UserList v-else-if="selectedTab === 'users'" />
      <AboutThis v-else-if="selectedTab === 'about'" />
    </div>
  </div>
  <div class="absolute inset-0 root z-50 pointer-events-none" v-bind="$attrs">
    <button
      class="h-10 fill-white aspect-square absolute left-2 bottom-14 rounded-full drop-shadow-md pointer-events-auto"
      :class="{
        'bg-black': selectedTab === 'main',
        'bg-cyan-500': selectedTab !== 'main',
      }"
      @click="changeTab"
    >
      <v-icon :name="tabs[selectedTab]" />
    </button>
  </div>
</template>
<style scoped lang="scss">
$padding: 1rem;
.root {
  padding-top: calc(var(--sait) + $padding);
  padding-left: calc(var(--sail) + $padding);
  padding-right: calc(var(--sair) + $padding);
  padding-bottom: calc(var(--saib) + $padding);
}
</style>
