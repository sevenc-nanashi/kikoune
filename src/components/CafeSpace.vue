<script setup lang="ts">
import { computed, ref } from "vue"
import consola from "consola"
import CafeUser from "./CafeUser.vue"
import { useStore } from "~/store"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"

const store = useStore()
const discordSdk = useDiscordSdk()
const users = computed(() =>
  store.participants.filter((p) => store.getUser(p.id) !== undefined)
)
const container = ref<HTMLElement>()
const move = (e: MouseEvent) => {
  if (!container.value) return
  const containerRect = container.value.getBoundingClientRect()
  const cursorX = e.clientX - containerRect.left
  const cursorY = e.clientY - containerRect.top
  const x = (cursorX / containerRect.width) * 2 - 1
  const y = (cursorY / containerRect.height) * 2 - 1

  consola.info("Moving user", x, y)

  fetch(`/api/room/${discordSdk.instanceId}/state`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${store.me.id} ${store.token}`,
    },
    body: JSON.stringify({ state: { x, y } }),
  })
  store.setStateOverride({ x, y })
}
</script>
<template>
  <div class="bg-black/25 relative" ref="container" @click="move">
    <CafeUser v-for="user in users" :id="user.id" :key="user.id" />
    <div class="absolute inset-0 pointer-events-none opacity-50">
      <div class="absolute top-1/2 left-0 right-0 h-[1px] bg-white" />
      <div class="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white" />
    </div>
  </div>
</template>
<style scoped lang="scss">
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
