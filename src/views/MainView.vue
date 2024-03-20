<script setup lang="ts">
import { onMounted, onUnmounted, ref, watchEffect } from "vue"
import consola from "consola"
import NicoPlayer from "~/components/NicoPlayer.vue"
import QueueList from "~/components/QueueList.vue"
import NowPlaying from "~/components/NowPlaying.vue"
import CafeSpace from "~/components/CafeSpace.vue"
import { VideoInfo } from "~/lib/nicoTypes"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"

const discordSdk = useDiscordSdk()
const store = useStore()
const currentId = ref("sm42571052")
const thumbnailUrl = ref("")

const userX = ref(0)
const userY = ref(0)

const update = async () => {
  const res = await fetch(`/api/room/${discordSdk.channelId}`, {
    method: "put",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${discordSdk.clientId} ${store.token}`,
    },
    body: JSON.stringify({
      x: userX.value,
      y: userY.value,
    }),
  })
  const data = await res.json()
  consola.info(data)
}
let interval: ReturnType<typeof setInterval>
onMounted(() => {
  update()
  interval = setInterval(update, 5000)
})
onUnmounted(() => {
  clearInterval(interval)
})
const onNicoLoad = ({ videoInfo }: { videoInfo: VideoInfo }) => {
  thumbnailUrl.value = videoInfo.thumbnailUrl
}
</script>
<template>
  <div class="gap-8 w-screen h-screen sm:relative root">
    <div>
      <NicoPlayer
        :id="currentId"
        class="h-screen w-screen sm:w-auto sm:h-full aspect-video"
        @load-complete="onNicoLoad"
      />
      <QueueList />
    </div>
    <NowPlaying />
    <CafeSpace class="cafe-space" />
  </div>
  <div class="background-container">
    <div
      class="background"
      :style="{ backgroundImage: `url(${thumbnailUrl})` }"
    />
  </div>
</template>
<style scoped lang="scss">
.root {
  padding-top: calc(var(--sait) + 2rem);
  padding-left: calc(var(--sail) + 2rem);
  padding-right: calc(var(--sair) + 2rem);
  padding-bottom: calc(var(--saib) + 2rem);

  @media (max-width: 640px) {
    padding: 0;
  }

  display: grid;
  grid-template-rows: 40% 5% 1fr;
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
