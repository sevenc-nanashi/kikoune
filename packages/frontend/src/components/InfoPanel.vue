<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { useStore } from "~/store";

import AboutThis from "./AboutThis.vue";
import DebugInfo from "./DebugInfo.vue";
import QueueList from "./QueueList.vue";
import SessionSetting from "./SessionSetting.vue";
import UserList from "./UserList.vue";

const store = useStore();
const zoomScale = ref(1);

const zoomIn = () => {
  zoomScale.value = Math.min(1.5, zoomScale.value + 0.05);
};

const zoomOut = () => {
  zoomScale.value = Math.max(0.5, zoomScale.value - 0.05);
};

watch(
  () => zoomScale.value,
  (scale) => {
    document.documentElement.style.setProperty("--zoom-scale", scale.toString());
  },
  { immediate: true },
);

type Panel = {
  name: PanelName;
  label: string;
  icon: string;
};
const panels = computed(() => {
  const panels: Panel[] = [
    { name: "queue", label: "キュー", icon: "md-queuemusic" },
    { name: "users", label: "ユーザー", icon: "md-people" },
    { name: "about", label: "このアプリについて", icon: "md-info" },
  ];
  if (store.isHost) {
    panels.push({ name: "sessionSetting", label: "部屋の設定", icon: "md-settings" });
  }
  if (store.debug) {
    panels.push({ name: "debug", label: "デバッグ", icon: "md-bugreport" });
  }
  return panels;
});

export type PanelName = "queue" | "users" | "about" | "sessionSetting" | "debug";
const selectedTab = ref<PanelName>("queue");
</script>
<template>
  <div un-min-h="full" un-relative un-flex="~ col" un-flex-grow>
    <nav un-bg="black" un-h="8" un-px="2" un-flex="~ row" un-items="center">
      <button
        v-for="panel in panels"
        :key="panel.name"
        un-mr="4"
        :un-opacity="panel.name !== selectedTab ? '50' : null"
        @click="selectedTab = panel.name"
      >
        <v-icon un-inline un-hidden="lg:~" un-ml="1" :name="panel.icon" />
        <span un-hidden un-inline="lg:~">
          {{ panel.label }}
        </span>
      </button>
      <div un-flex-grow />
      <span un-text="sm">{{ (zoomScale * 100).toFixed() }} %</span>

      <!-- メモ：*100してroundしないと小数点誤差でバグる -->
      <button un-ml="2" :disabled="Math.round(zoomScale * 100) === 150" @click="zoomIn">
        <v-icon name="md-zoomin" />
      </button>

      <button un-ml="2" :disabled="Math.round(zoomScale * 100) === 50" @click="zoomOut">
        <v-icon name="md-zoomout" />
      </button>
    </nav>
    <div un-h="[calc(100%_-_2rem)]" un-overflow-x="hidden">
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
