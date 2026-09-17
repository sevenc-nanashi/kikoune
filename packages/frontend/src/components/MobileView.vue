<script setup lang="ts">
import { computed, ref } from "vue";

import { useStore } from "~/store";

import AboutThis from "./AboutThis.vue";
import DebugInfo from "./DebugInfo.vue";
import { PanelName as DesktopPanelName } from "./InfoPanel.vue";
import QueueList from "./QueueList.vue";
import SessionSetting from "./SessionSetting.vue";
import UserList from "./UserList.vue";

const store = useStore();

const tabs = computed(() => {
  const ret: Record<string, string> = {
    main: "md-home",
    queue: "md-queuemusic",
    users: "md-people",
    about: "md-info",
  };
  if (store.isHost) {
    ret.sessionSetting = "md-settings";
  }
  if (store.debug) {
    ret.debug = "md-bugreport";
  }

  return ret;
});

type PanelName = DesktopPanelName | "main";

const tabNames: Record<PanelName, string> = {
  main: "ホーム",
  queue: "キュー",
  users: "ユーザー",
  about: "このアプリについて",
  sessionSetting: "部屋の設定",
  debug: "デバッグ",
} as const;

const selectedTab = ref<PanelName>("main");
const changeTab = () => {
  const keys = Object.keys(tabs.value) as PanelName[];
  const currentIndex = keys.indexOf(selectedTab.value);
  const nextIndex = (currentIndex + 1) % keys.length;
  selectedTab.value = keys[nextIndex];
};
</script>
<template>
  <div
    un-absolute
    un-inset="0"
    un-z="100"
    :un-hidden="selectedTab === 'main' ? '~' : 'md:~'"
    un-flex="~ col"
  >
    <div
      un-w="full"
      un-relative
      un-flex="~ row"
      un-bg="black"
      un-h="16"
      un-pt="[calc(var(--sait)_+_1rem)]"
      un-pl="[calc(var(--sail)_+_1rem)]"
      un-pr="[calc(var(--sair)_+_1rem)]"
      un-font="bold"
      un-text="2xl"
      un-items="end"
      un-justify="start"
    >
      {{ tabNames[selectedTab] }}
    </div>
    <div
      un-h="[calc(100%_-_4rem)]"
      un-relative
      un-w="full"
      un-bg="black/75"
      un-backdrop-blur="sm"
      un-pl="[var(--sail)]"
      un-pr="[var(--sair)]"
      un-pb="[var(--saib)]"
    >
      <QueueList v-if="selectedTab === 'queue'" />
      <UserList v-else-if="selectedTab === 'users'" />
      <AboutThis v-else-if="selectedTab === 'about'" />
      <SessionSetting v-else-if="selectedTab === 'sessionSetting'" />
      <DebugInfo v-else-if="selectedTab === 'debug'" />
    </div>
  </div>
  <button
    un-h="10"
    un-fill="white"
    un-aspect="square"
    un-absolute
    un-left="4"
    un-bottom="16 sm:18"
    un-z="101"
    un-rounded="full"
    un-drop-shadow="md"
    un-pointer-events="auto"
    un-grid
    un-place-items="center"
    un-hidden="md:~"
    :un-bg="selectedTab === 'main' ? 'black' : 'cyan-500'"
    @click="changeTab"
  >
    <v-icon :name="tabs[selectedTab]" />
  </button>
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
