<script setup lang="ts">
import { ref } from "vue"
import QueueList from "./QueueList.vue"
import UserList from "./UserList.vue"
import AboutThis from "./AboutThis.vue"

const tabs = {
  queue: "キュー",
  users: "ユーザー",
  about: "このアプリについて",
} as const
const selectedTab = ref<keyof typeof tabs>("queue")
</script>
<template>
  <div class="min-h-full w-full relative flex flex-col">
    <nav class="bg-black h-8 px-2 gap-4 flex flex-row items-center">
      <button
        v-for="tab in Object.keys(tabs)"
        :key="tab"
        :class="{
          'opacity-50': tab !== selectedTab,
        }"
        @click="selectedTab = tab as keyof typeof tabs"
      >
        {{ tabs[tab as keyof typeof tabs] }}
      </button>
    </nav>
    <div class="h-[calc(100%_-_2rem)] overflow-x-hidden overflow-y-scroll">
      <QueueList v-if="selectedTab === 'queue'" />
      <UserList v-else-if="selectedTab === 'users'" />
      <AboutThis v-else />
    </div>
  </div>
</template>
<style scoped lang="scss"></style>
