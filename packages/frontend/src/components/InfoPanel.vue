<script setup lang="ts">
import { computed, ref, watch } from "vue"
import QueueList from "./QueueList.vue"
import UserList from "./UserList.vue"
import AboutThis from "./AboutThis.vue"
import DebugInfo from "./DebugInfo.vue"
import SessionSetting from "./SessionSetting.vue"
import { useStore } from "~/store"

const store = useStore()
const zoomScale = ref(1)

const zoomIn = () => {
  zoomScale.value = Math.min(1.5, zoomScale.value + 0.05)
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

const tabs = computed(() => {
  const ret: Record<string, string> = {
    queue: "キュー",
    users: "ユーザー",
    about: "このアプリについて",
  }
  if (store.isHost) {
    ret.sessionSetting = "部屋の設定"
  }
  if (store.debug) {
    ret.debug = "デバッグ"
  }

  return ret
})

export type PanelName = "queue" | "users" | "about" | "sessionSetting" | "debug"
const selectedTab = ref<PanelName>("queue")
</script>
<template>
  <div class="min-h-full relative flex flex-col flex-grow">
    <nav class="bg-black h-8 px-2 flex flex-row items-center">
      <button
        v-for="tab in Object.keys(tabs)"
        :key="tab"
        class="mr-4"
        :class="{
          'opacity-50': tab !== selectedTab,
        }"
        @click="selectedTab = tab as PanelName"
      >
        {{ tabs[tab as keyof typeof tabs] }}
      </button>
      <div class="flex-grow" />
      <span class="text-sm">{{ (zoomScale * 100).toFixed() }} %</span>

      <!-- メモ：*100してroundしないと小数点誤差でバグる -->
      <button
        class="ml-2"
        :disabled="Math.round(zoomScale * 100) === 150"
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
      <SessionSetting v-else-if="selectedTab === 'sessionSetting'" />
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
