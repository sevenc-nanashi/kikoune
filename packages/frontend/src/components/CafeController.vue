<script setup lang="ts">
import { maxMessageLength } from "@kikoune/shared";
import { MemberState } from "@kikoune/shared";
import { computed, ref } from "vue";

import { useDiscordSdk } from "~/plugins/useDiscordSdk";
import { useStore } from "~/store";

defineOptions({
  inheritAttrs: false,
});

const store = useStore();
const discordSdk = useDiscordSdk();

const updateState = (state: Partial<MemberState>) =>
  fetch(`/api/room/${discordSdk.instanceId}/state`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${store.me.id} ${store.token}`,
    },
    body: JSON.stringify({ state }),
  });
const switchRotate = () => {
  updateState({ rotate: !rotate.value });
  store.setStateOverride({
    rotate: !rotate.value,
  });
};
const rotate = computed(
  () => store.stateOverride.rotate ?? store.memberStates[store.me.id]?.rotate,
);
const mobileSend = computed(() => {
  if (!store.memberStates[store.me.id]) return true;

  return (
    message.value &&
    ((store.stateOverride.message ?? store.memberStates[store.me.id].message) !== message.value ||
      (store.stateOverride.message ?? store.memberStates[store.me.id].message) === "")
  );
});
const message = ref<string>();
const clearMessage = () => {
  if (!message.value) return;
  message.value = "";
  updateState({ message: "" });
  store.setStateOverride({ message: "" });
};

let prevMessageTimeout: ReturnType<typeof setTimeout>;
const onSubmit = () => {
  if (!message.value) return;
  if (window.innerWidth < 640 && !mobileSend.value) {
    clearMessage();
    return;
  }
  updateState({ message: message.value });
  store.setStateOverride({ message: message.value });
  if (prevMessageTimeout) clearTimeout(prevMessageTimeout);
  prevMessageTimeout = setTimeout(() => {
    clearMessage();
  }, 120 * 1000);
};
</script>
<template>
  <div
    un-w="full"
    un-flex="sm:~ miniplayer:~ row"
    un-gap="2"
    un-bottom="auto"
    un-relative
    un-hidden
    v-bind="$attrs"
  >
    <button
      un-h="full"
      un-aspect="auto"
      un-absolute
      un-right="auto"
      un-py="0"
      un-px="4"
      un-sm="relative"
      :un-bg="rotate ? 'cyan-500' : 'black/50'"
      :un-focus="rotate ? null : 'bg-black'"
      :un-hover="rotate ? null : 'bg-black'"
      @click="switchRotate"
    >
      <span un-hidden un-sm="inline">回る</span>
    </button>
    <form un-flex-grow un-flex="~ row" un-gap="2" @submit.prevent="onSubmit">
      <input
        v-model="message"
        :maxlength="maxMessageLength"
        placeholder="吹き出しの内容を入力..."
        un-bg="white"
        un-p="2"
        un-text="slate-950"
        un-outline="none"
        un-flex-grow
        un-rounded="none"
      />
      <button
        type="submit"
        :maxlength="maxMessageLength"
        un-h="10"
        un-absolute
        un-rounded="full"
        un-aspect="square"
        un-bottom="14"
        un-right="2"
        un-block
        un-drop-shadow="md sm:none"
        un-sm="hidden"
        :un-bg="mobileSend ? 'black' : 'cyan-500'"
      >
        <v-icon v-if="mobileSend" name="md-message" />
        <v-icon v-else name="md-close" />
      </button>
      <button
        type="submit"
        un-h="full"
        un-bg="black/50"
        un-focus="bg-black"
        un-hover="bg-black"
        un-p="3"
        un-w="36"
        un-cursor="pointer"
        un-active="bg-cyan-500"
        un-hidden
        un-sm="block"
      >
        吹き出し
      </button>
    </form>
    <button
      un-h="full"
      un-bg="black/50"
      un-focus="bg-black"
      un-hover="bg-black"
      un-px="4"
      un-active="bg-cyan-500"
      un-hidden
      un-sm="block"
      @click="clearMessage"
    >
      消す
    </button>
  </div>
  <form
    un-hidden="sm:~ miniplayer:~"
    un-w="full"
    un-relative
    @submit.prevent="onSubmit"
    v-bind="$attrs"
  >
    <input
      v-model="message"
      :maxlength="maxMessageLength"
      placeholder="吹き出しの内容を入力..."
      un-w="full"
      un-h="10"
      un-bg="white"
      un-p="2"
      un-text="slate-950"
      un-outline="none"
      un-flex-grow
      un-rounded="none"
      un-placeholder="sm:transparent"
    />
    <div
      un-absolute
      un-bottom="14"
      un-right="2"
      un-pointer-events="none"
      un-flex="~ col"
      un-gap="2"
    >
      <button
        type="button"
        un-pointer-events="auto"
        un-grid
        un-size="10"
        un-aspect="square"
        un-rounded="full"
        un-place-items="center"
        un-drop-shadow="md"
        :un-bg="rotate ? 'cyan-500' : 'black'"
        @click="switchRotate"
      >
        <v-icon name="md-refresh" />
      </button>
      <button
        type="submit"
        un-pointer-events="auto"
        un-grid
        un-size="10"
        un-aspect="square"
        un-rounded="full"
        un-place-items="center"
        un-drop-shadow="md"
        :un-bg="mobileSend ? 'black' : 'cyan-500'"
      >
        <v-icon v-if="mobileSend" name="md-message" />
        <v-icon v-else name="md-close" />
      </button>
    </div>
  </form>
</template>
<style scoped lang="scss"></style>
