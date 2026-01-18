<script setup lang="ts">
import { computed, ref } from "vue";
import QueueList from "./QueueList.vue";
import UserList from "./UserList.vue";
import AboutThis from "./AboutThis.vue";
import DebugInfo from "./DebugInfo.vue";
import SessionSetting from "./SessionSetting.vue";
import { PanelName as DesktopPanelName } from "./InfoPanel.vue";
import { useStore } from "~/store";

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
    class="hidden-on-miniplayer"
    un-absolute
    un-inset="0"
    un-z="40"
    un-hidden
    :un-flex="selectedTab !== 'main' ? 'xs:max-sm:~ xs:max-sm:col' : null"
  >
    <div
      un-w="full"
      un-relative
      un-flex="~ row"
      un-bg="black"
      un-h="16"
      un-font="bold"
      un-text="2xl"
      un-items="end"
      un-justify="start"
    >
      {{ tabNames[selectedTab] }}
    </div>
    <div un-h="[calc(100vh_-_4rem)]" un-relative un-w="full" un-bg="black/75">
      <QueueList v-if="selectedTab === 'queue'" />
      <UserList v-else-if="selectedTab === 'users'" />
      <AboutThis v-else-if="selectedTab === 'about'" />
      <SessionSetting v-else-if="selectedTab === 'sessionSetting'" />
      <DebugInfo v-else-if="selectedTab === 'debug'" />
    </div>
  </div>
  <div
    class="root hidden-on-miniplayer"
    un-absolute
    un-inset="0"
    un-z="50"
    un-pointer-events="none"
    v-bind="$attrs"
  >
    <button
      un-h="10"
      un-fill="white"
      un-aspect="square"
      un-absolute
      un-left="2"
      un-bottom="14"
      un-rounded="full"
      un-drop-shadow="md"
      un-pointer-events="auto"
      :un-bg="selectedTab === 'main' ? 'black' : 'cyan-500'"
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
