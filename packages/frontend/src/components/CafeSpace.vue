<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import consola from "consola/browser";
import CafeUser from "./CafeUser.vue";
import { useStore } from "~/store";
import { useDiscordSdk } from "~/plugins/useDiscordSdk";

const store = useStore();
const discordSdk = useDiscordSdk();
const log = consola.withTag("CafeSpace");

const users = computed(() => store.participants.filter((p) => store.getUser(p.id) !== undefined));
const container = ref<HTMLElement>();
const capPosition = (pos: number) => Math.max(-1, Math.min(1, pos));

const move = (e: MouseEvent) => {
  if (!container.value) return;
  const containerRect = container.value.getBoundingClientRect();
  const cursorX = e.clientX - containerRect.left;
  const cursorY = e.clientY - containerRect.top;
  const x = capPosition((cursorX / containerRect.width) * 2 - 1);
  const y = capPosition((cursorY / containerRect.height) * 2 - 1);

  log.info("Moving user", x, y);

  fetch(`/api/room/${discordSdk.instanceId}/state`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${store.me.id} ${store.token}`,
    },
    body: JSON.stringify({ state: { x, y } }),
  });
  store.setStateOverride({ x, y });
};

const speakingData = ref<Record<string, boolean>>({});

const onSpeakingUpdate = (value: boolean) => (data: { user_id: string }) => {
  log.info(`Speaking ${value ? "start" : "stop"}`, data.user_id);
  speakingData.value = {
    ...speakingData.value,
    [data.user_id]: value,
  };
};
const onSpeakingStart = onSpeakingUpdate(true);
const onSpeakingStop = onSpeakingUpdate(false);

onMounted(() => {
  discordSdk.subscribe("SPEAKING_START", onSpeakingStart, {
    channel_id: discordSdk.channelId!,
  });
  discordSdk.subscribe("SPEAKING_STOP", onSpeakingStop, {
    channel_id: discordSdk.channelId!,
  });
});
onUnmounted(() => {
  discordSdk.unsubscribe("SPEAKING_START", onSpeakingStart, {
    channel_id: discordSdk.channelId!,
  });
  discordSdk.unsubscribe("SPEAKING_STOP", onSpeakingStop, {
    channel_id: discordSdk.channelId!,
  });
});
</script>
<template>
  <div ref="container" un-relative @click="move">
    <CafeUser
      v-for="user in users"
      :id="user.id"
      :key="user.id"
      :speaking="!!speakingData[user.id]"
    />
    <div un-absolute un-inset="0" un-pointer-events="none">
      <div
        un-absolute
        un-top="0"
        un-left="0"
        un-w="[calc(50%_-_2px)]"
        un-h="[calc(50%_-_2px)]"
        un-bg="black/50"
      />
      <div
        un-absolute
        un-top="0"
        un-right="0"
        un-w="1/2"
        un-h="[calc(50%_-_2px)]"
        un-bg="black/50"
      />
      <div
        un-absolute
        un-bottom="0"
        un-left="0"
        un-w="[calc(50%_-_2px)]"
        un-h="1/2"
        un-bg="black/50"
      />
      <div un-absolute un-bottom="0" un-right="0" un-w="1/2" un-h="1/2" un-bg="black/50" />
    </div>
  </div>
</template>
<style scoped lang="scss"></style>
