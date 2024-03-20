<script setup lang="ts">
import { computed, ref } from "vue"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"
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
const rotate = computed(() => {
  return store.stateOverride.rotate ?? store.memberStates[store.me.id]?.rotate
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
  updateState({ message: message.value.value })
  store.setStateOverride({ message: message.value.value })
}
</script>
<template>
  <div class="w-full flex flex-row gap-2 relative">
    <button
      class="h-full px-4"
      :class="{
        'bg-black active:bg-cyan-500': !rotate,
        'bg-cyan-500': rotate,
      }"
      @click="switchRotate"
    >
      回る
    </button>
    <form class="flex-grow flex flex-row gap-2" @submit.prevent="onSubmit">
      <input
        ref="message"
        class="bg-white p-2 text-slate-950 outline-none flex-grow"
      />
      <input
        type="submit"
        class="h-full bg-black p-3 w-24 cursor-pointer active:bg-cyan-500"
        label="吹き出し"
      />
    </form>
    <button
      class="h-full bg-black px-4 active:bg-cyan-500"
      @click="clearMessage"
    >
      消す
    </button>
  </div>
</template>
<style scoped lang="scss"></style>
