<script setup lang="ts">
import consola from "consola"
import { v4 as uuid } from "uuid"
import { computed, ref, onMounted, onUnmounted } from "vue"
import { useStore } from "~/store"

const store = useStore()
const player = ref<HTMLIFrameElement | undefined>(undefined)
const playerNonce = uuid()
const videoId = computed(() => store.session.video?.id)
const nonce = computed(() => store.session.video?.nonce)
const src = computed(
  () =>
    `/nico/nico-embed/${videoId.value}?${new URLSearchParams({
      jsapi: "1",
      playerId: playerNonce,
      noRelatedVideo: "0",
      autoplay: "1",
      mute: "0",
      defaultNoComment: "0",
      noLinkToNiconico: "0",
      noController: "0",
      noHeader: "0",
      noTags: "0",
      noShare: "0",
      noVideoDetail: "0",
      allowProgrammaticFullScreen: "1",
      noIncrementViewCount: "0",
      persistence: "1",
      disableAdCheck: "0",
      referer: location.href,
    })}`
)

let seekDone = false
const onMessage = (event: MessageEvent) => {
  if (event.origin !== location.origin) {
    return
  }
  if (event.source !== player.value?.contentWindow) {
    return
  }
  const data = event.data
  switch (data.eventName) {
    case "loadComplete": {
      consola.log("Player load complete, playing")
      player.value.contentWindow?.postMessage(
        {
          eventName: "play",
          sourceConnectorType: 1,
          playerId: playerNonce,
        },
        location.origin
      )
      seekDone = false
      break
    }
    case "playerStatusChange": {
      consola.info(`Status changed to ${data.data.playerStatus}`)
      if (data.data.playerStatus !== 2) {
        return
      }
      if (seekDone) {
        return
      }
      const currentTime = Date.now() - store.session.startedAt - 2000
      if (currentTime < 0) {
        return
      }
      consola.info(`sending seek: ${currentTime}`)
      player.value.contentWindow?.postMessage(
        {
          eventName: "seek",
          data: {
            time: currentTime,
          },
          playerId: playerNonce,
          sourceConnectorType: 1,
        },
        location.origin
      )
      break
    }
    case "playerMetadataChange": {
      const currentTime = Date.now() - store.session.startedAt - 2000
      if (
        !seekDone &&
        Math.abs(currentTime - data.data.currentTime) / 1000 < 1
      ) {
        consola.info(`Seek done: ${data.data.currentTime}`)
        seekDone = true
      }
      break
    }
    default: {
      // consola.log("Discarding message", data)
    }
  }
}
onMounted(() => {
  window.addEventListener("message", onMessage)
})
onUnmounted(() => {
  window.removeEventListener("message", onMessage)
})
</script>
<template>
  <div
    class="relative aspect-video"
    :class="{
      'bg-slate-500 place-items-center place-content-center grid': !videoId,
    }"
  >
    <iframe
      v-if="videoId"
      ref="player"
      :key="nonce"
      :src
      class="block absolute w-full h-full bg-black"
    />
    <template v-else>
      <h1 class="text-2xl">待機中...</h1>
      <p class="hidden sm:block">右の欄から動画を再生できます。</p>
    </template>
  </div>
</template>
<style lang="scss"></style>
