<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue"
import consola from "consola"
import NicoPlayer from "~/components/NicoPlayer.vue"
import QueueList from "~/components/QueueList.vue"
import NowPlaying from "~/components/NowPlaying.vue"
import CafeSpace from "~/components/CafeSpace.vue"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"
import { Position, Session } from "~types/type.js"

const discordSdk = useDiscordSdk()
const store = useStore()
const thumbnailUrl = computed(() => {
  const base = store.session.video?.thumbnailUrl
  if (!base) return ""
  const path = new URL(base).pathname
  return `/external/nicovideo-cdn-nimg-jp${path}`
})

const userX = ref(0)
const userY = ref(0)

const errorCount = ref(0)

const update = async () => {
  const res = await fetch(`/api/room/${discordSdk.instanceId}/sync`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${store.me.id} ${store.token}`,
    },
    body: JSON.stringify({
      userIds: store.participants.map((user) => user.id),
      position: store.myPosition,
    }),
  })
  if (!res.ok) {
    consola.error("Failed to update user position")
    errorCount.value++
    if (errorCount.value > 3) {
      store.panic()
    }
    return
  }
  errorCount.value = 0
  const data: {
    member: Record<string, Position>
    session: Session
  } = await res.json()
  store.setSession(data.session)
}

const currentId = computed(() => store.session.video?.id ?? "")
let interval: ReturnType<typeof setInterval>
onMounted(() => {
  update()
  interval = setInterval(update, 5000)
})
onUnmounted(() => {
  clearInterval(interval)
})
</script>
<template>
  <div
    class="bg-white/25 absolute inset-0 place-items-center place-content-center grid transition-opacity z-20"
    :style="{
      opacity: errorCount > 0 ? 1 : 0,
      pointerEvents: errorCount > 0 ? 'auto' : 'none',
    }"
  />
  <div class="w-screen h-screen sm:relative root">
    <div class="sm:relative flex top-section h-full">
      <NicoPlayer class="h-screen w-screen sm:w-auto sm:h-full aspect-video" />
      <QueueList class="hidden sm:flex h-full" />
    </div>
    <NowPlaying class="hidden sm:flex h-full" />
    <CafeSpace class="cafe-space hidden sm:block" />
  </div>
  <div class="background-container hidden sm:block">
    <div
      class="background"
      :style="{ backgroundImage: currentId && `url(${thumbnailUrl})` }"
      :class="{ 'bg-slate-500': !currentId }"
    />
  </div>
</template>
<style scoped lang="scss">
$padding: 8px;
.root {
  padding-top: calc(var(--sait) + $padding);
  padding-left: calc(var(--sail) + $padding);
  padding-right: calc(var(--sair) + $padding);
  padding-bottom: calc(var(--saib) + $padding);

  gap: $padding;

  @media (max-width: 640px) {
    padding: 0;
  }

  display: grid;
  grid-template-rows: calc(50vh - 4.5rem) 4.5rem 1fr;
}
.top-section {
  gap: $padding;
}
.background-container {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.background {
  position: absolute;
  inset: -3rem;
  transition: background 300ms;
  background-size: cover;
  background-position: center;
  filter: blur(25px) brightness(0.5);
}
</style>
