<script setup lang="ts">
import { computed, ref } from "vue"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"
import { maxMessageLength } from "~shared/const"
import { MemberState } from "~shared/schema"

const store = useStore()
const discordSdk = useDiscordSdk()

const updateState = (state: Partial<MemberState>) =>
  fetch(`/api/room/${discordSdk.instanceId}/state`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${store.me.id} ${store.token}`,
    },
    body: JSON.stringify({ state }),
  })
const switchRotate = () => {
  updateState({ rotate: !rotate.value })
  store.setStateOverride({
    rotate: !rotate.value,
  })
}
const rotate = computed(
  () => store.stateOverride.rotate ?? store.memberStates[store.me.id]?.rotate
)
const mobileSend = computed(() => {
  if (!store.memberStates[store.me.id]) return true

  return (
    message.value &&
    ((store.stateOverride.message ??
      store.memberStates[store.me.id].message) !== message.value.value ||
      (store.stateOverride.message ??
        store.memberStates[store.me.id].message) === "")
  )
})
const message = ref<HTMLInputElement>()
const clearMessage = () => {
  if (!message.value) return
  message.value.value = ""
  updateState({ message: "" })
  store.setStateOverride({ message: "" })
}
const onSubmit = () => {
  if (!message.value?.value) return
  if (window.innerWidth < 640 && !mobileSend.value) {
    clearMessage()
    return
  }
  updateState({ message: message.value.value })
  store.setStateOverride({ message: message.value.value })
}
</script>
<template>
  <div class="w-full flex flex-row gap-2 bottom-0 sm:bottom-auto relative">
    <button
      class="h-10 sm:h-full aspect-square sm:aspect-auto sm:py-0 sm:px-4 absolute sm:relative right-2 bottom-[6.5rem] rounded-full sm:rounded-none sm:right-auto sm:bottom-auto drop-shadow-md sm:drop-shadow-none"
      :class="{
        'bg-black sm:bg-black/50 focus:bg-black hover:bg-black': !rotate,
        'bg-cyan-500': rotate,
      }"
      @click="switchRotate"
    >
      <span class="hidden sm:inline">回る</span>
      <v-icon class="sm:hidden inline" name="md-refresh" />
    </button>
    <form class="flex-grow flex flex-row gap-2" @submit.prevent="onSubmit">
      <input
        ref="message"
        :maxlength="maxMessageLength"
        placeholder="吹き出しの内容を入力..."
        class="bg-white p-2 text-slate-950 outline-none flex-grow rounded-none sm:placeholder-transparent"
      />
      <button
        type="submit"
        :maxlength="maxMessageLength"
        class="h-10 absolute rounded-full aspect-square bottom-14 right-2 block sm:hidden drop-shadow-md sm:drop-shadow-none"
        :class="{
          'bg-black': mobileSend,
          'bg-cyan-500': !mobileSend,
        }"
      >
        <v-icon v-if="mobileSend" name="md-message" />
        <v-icon v-else name="md-close" />
      </button>
      <button
        type="submit"
        class="h-full bg-black/50 focus:bg-black hover:bg-black p-3 w-36 cursor-pointer active:bg-cyan-500 hidden sm:block"
      >
        吹き出し
      </button>
    </form>
    <button
      class="h-full bg-black/50 focus:bg-black hover:bg-black px-4 active:bg-cyan-500 hidden sm:block"
      @click="clearMessage"
    >
      消す
    </button>
  </div>
</template>
<style scoped lang="scss"></style>
