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
const capPosition = (pos: number) => Math.max(-1, Math.min(1, pos))
const move = (e: MouseEvent) => {
  if (!container.value) return
  const containerRect = container.value.getBoundingClientRect()
  const cursorX = e.clientX - containerRect.left
  const cursorY = e.clientY - containerRect.top
  const x = capPosition((cursorX / containerRect.width) * 2 - 1)
  const y = capPosition((cursorY / containerRect.height) * 2 - 1)

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
  <div ref="container" class="relative" @click="move">
    <CafeUser v-for="user in users" :id="user.id" :key="user.id" />
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute top-0 left-0 w-[calc(50%_-_2px)] h-[calc(50%_-_2px)] bg-black/50"
      />
      <div
        class="absolute top-0 right-0 w-1/2 h-[calc(50%_-_2px)] bg-black/50"
      />
      <div
        class="absolute bottom-0 left-0 w-[calc(50%_-_2px)] h-1/2 bg-black/50"
      />
      <div class="absolute bottom-0 right-0 w-1/2 h-1/2 bg-black/50" />
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
