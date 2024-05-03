<script setup lang="ts">
import { computed, ref, watch } from "vue"
import QueueList from "./QueueList.vue"
import UserList from "./UserList.vue"
import AboutThis from "./AboutThis.vue"
import DebugInfo from "./DebugInfo.vue"
import { useStore } from "~/store"

const store = useStore()
const zoomScale = ref(1)

const zoomIn = () => {
  zoomScale.value = Math.min(1.0, zoomScale.value + 0.05)
}

const zoomOut = () => {
  zoomScale.value = Math.max(0.5, zoomScale.value - 0.05)
}

watch(
  () => zoomScale.value,
  (scale) => {
    document.documentElement.style.setProperty("--zoom-scale", scale.toString())
  },
  { immediate: true }
)

const tabs = computed(() =>
  store.debug
    ? ({
        queue: "キュー",
        users: "ユーザー",
        about: "このアプリについて",
        debug: "デバッグ",
      } as const)
    : ({
        queue: "キュー",
        users: "ユーザー",
        about: "このアプリについて",
      } as const)
)
const selectedTab = ref<keyof typeof tabs.value>("queue")
</script>
<template>
  <div class="min-h-full w-full relative flex flex-col">
    <nav class="bg-black h-8 px-2 flex flex-row items-center">
      <button
        v-for="tab in Object.keys(tabs)"
        :key="tab"
        class="mr-4"
        :class="{
          'opacity-50': tab !== selectedTab,
        }"
        @click="selectedTab = tab as keyof typeof tabs"
      >
        {{ tabs[tab as keyof typeof tabs] }}
      </button>
      <div class="flex-grow" />
      <span class="text-sm">{{ (zoomScale * 100).toFixed() }} %</span>

      <!-- メモ：*100してroundしないと小数点誤差でバグる -->
      <button
        class="ml-2"
        :disabled="Math.round(zoomScale * 100) === 100"
        @click="zoomIn"
      >
        <v-icon name="md-zoomin" />
      </button>

      <button
        class="ml-2"
        :disabled="Math.round(zoomScale * 100) === 50"
        @click="zoomOut"
      >
        <v-icon name="md-zoomout" />
      </button>
    </nav>
    <div class="h-[calc(100%_-_2rem)] overflow-x-hidden">
      <QueueList v-if="selectedTab === 'queue'" />
      <UserList v-else-if="selectedTab === 'users'" />
      <AboutThis v-else-if="selectedTab === 'about'" />
      <DebugInfo v-else-if="selectedTab === 'debug'" />
    </div>
  </div>
</template>
<style scoped lang="scss">
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
