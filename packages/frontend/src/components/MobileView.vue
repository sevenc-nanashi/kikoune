<script setup lang="ts">
import { computed, ref } from "vue"
import QueueList from "./QueueList.vue"
import UserList from "./UserList.vue"
import AboutThis from "./AboutThis.vue"
import DebugInfo from "./DebugInfo.vue"
import SessionSetting from "./SessionSetting.vue"
import { PanelName as DesktopPanelName } from "./InfoPanel.vue"
import { useStore } from "~/store"

const store = useStore()

const tabs = computed(() => {
  const ret: Record<string, string> = {
    main: "md-home",
    queue: "md-queuemusic",
    users: "md-people",
    about: "md-info",
  }
  if (store.isHost) {
    ret.sessionSetting = "md-settings"
  }
  if (store.debug) {
    ret.debug = "md-bugreport"
  }

  return ret
})

type PanelName = DesktopPanelName | "main"

const tabNames: Record<PanelName, string> = {
  main: "ホーム",
  queue: "キュー",
  users: "ユーザー",
  about: "このアプリについて",
  sessionSetting: "部屋の設定",
  debug: "デバッグ",
} as const

const selectedTab = ref<PanelName>("main")
const changeTab = () => {
  const keys = Object.keys(tabs.value) as PanelName[]
  const currentIndex = keys.indexOf(selectedTab.value)
  const nextIndex = (currentIndex + 1) % keys.length
  selectedTab.value = keys[nextIndex]
}
</script>
<template>
  <div
    class="absolute inset-0 z-40 hidden flex-col hidden-on-miniplayer"
    :class="{
      'xs:max-sm:flex': selectedTab !== 'main',
    }"
  >
    <div
      class="w-full relative flex bg-black h-16 font-bold text-2xl flex-row items-end justify-start"
    >
      {{ tabNames[selectedTab] }}
    </div>
    <div class="h-[calc(100vh_-_4rem)] relative w-full bg-black/75">
      <QueueList v-if="selectedTab === 'queue'" />
      <UserList v-else-if="selectedTab === 'users'" />
      <AboutThis v-else-if="selectedTab === 'about'" />
      <SessionSetting v-else-if="selectedTab === 'sessionSetting'" />
      <DebugInfo v-else-if="selectedTab === 'debug'" />
    </div>
  </div>
  <div
    class="absolute inset-0 root z-50 pointer-events-none hidden-on-miniplayer"
    v-bind="$attrs"
  >
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
