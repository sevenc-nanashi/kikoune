<script setup lang="ts">
import consola from "consola/browser"
import { v4 as uuid } from "uuid"
import { computed, ref, onMounted, onUnmounted, watch } from "vue"
import { buffer } from "@kikoune/shared"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"

const store = useStore()
const discordSdk = useDiscordSdk()
const log = consola.withTag("NicoPlayer")

const player = ref<HTMLIFrameElement | undefined>(undefined)
const playerNonce = uuid()
const videoId = computed(() => store.session.video?.id)
const nonce = computed(() => store.session.video?.nonce)
const src = computed(
  () =>
    `/.proxy/nico/nico-embed/${videoId.value}?${new URLSearchParams({
      jsapi: "1",
      playerId: playerNonce,
      noRelatedVideo: "0",
      autoplay: "1",
      mute: "1",
      defaultNoComment: "0",
      noLinkToNiconico: "0",
      noController: "0",
      noHeader: "0",
      noTags: "0",
      noShare: "1",
      noVideoDetail: "0",
      allowProgrammaticFullScreen: "1",
      noIncrementViewCount: "0",
      persistence: "1",
      disableAdCheck: "0",
      referer: location.href,
    })}`
)

let status = ref<"init" | "preload" | "load" | "presync" | "sync" | "play">(
  "init"
)

watch(
  nonce,
  () => {
    log.info("Nonce changed, resetting status")
    status.value = "init"
  },
  { immediate: true }
)
const serverTime = ref(0)
let updateInterval: ReturnType<typeof setInterval> | undefined = undefined
watch(
  () => store.debug,
  (debug) => {
    if (debug) {
      updateInterval = setInterval(() => {
        serverTime.value =
          Date.now() - store.session.startedAt - buffer + store.delay
      }, 100)
    }
  },
  { immediate: true }
)
onUnmounted(() => {
  clearInterval(updateInterval)
})
const lastMuted = ref(false)
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
      log.info("Player load complete, playing")
      player.value.contentWindow?.postMessage(
        {
          eventName: "play",
          sourceConnectorType: 1,
          playerId: playerNonce,
        },
        location.origin
      )
      status.value = "preload"
      // @ts-expect-error 実際は存在する
      player.value.contentWindow?.eval(
        (() => {
          const observer = new MutationObserver(() => {
            observer.disconnect()
            try {
              const anchors = document.querySelectorAll("a:not([patched])")

              for (const anchor of anchors) {
                anchor.setAttribute("patched", "")
                anchor.addEventListener("click", (event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  const href = anchor.getAttribute("href")
                  if (href) {
                    window.parent.postMessage(
                      {
                        eventName: "navigate",
                        sourceConnectorType: 1,
                        playerId: "",
                        data: { url: href },
                      },
                      location.origin
                    )
                  }
                })
              }
            } finally {
              observer.observe(document, {
                childList: true,
                subtree: true,
              })
            }
          })
          observer.observe(document, {
            childList: true,
            subtree: true,
          })
        })
          .toString()
          .slice(12, -1)
      )
      break
    }
    case "navigate": {
      let url: string = data.data.url
      if (url.includes(location.origin)) {
        url = url.replace(location.origin + "/external/", "")
        const dummyHost = url.split("/")[0]
        url = "https://" + url.replace(dummyHost, dummyHost.replace(/-/g, "."))
      }
      discordSdk.commands.openExternalLink({ url })
      break
    }
    case "statusChange": {
      log.info(
        `Status changed to ${data.data.playerStatus} / ${data.data.seekStatus}`
      )
      if (data.data.playerStatus === 2 && status.value === "preload") {
        status.value = "load"
      }
      if (data.data.playerStatus === 3 && status.value === "presync") {
        status.value = "sync"
      }
      break
    }
    case "playerMetadataChange": {
      const targetTime =
        Date.now() - store.session.startedAt - buffer + store.delay
      if (targetTime < 0) {
        return
      }
      if (
        data.data.isVideoMetaDataLoaded &&
        data.data.maximumBuffered > targetTime &&
        status.value === "sync"
      ) {
        log.info(`Seeking to ${targetTime} to sync`)
        player.value.contentWindow?.postMessage(
          {
            eventName: "seek",
            sourceConnectorType: 1,
            playerId: playerNonce,

            data: {
              time: targetTime,
            },
          },
          location.origin
        )

        player.value.contentWindow?.postMessage(
          {
            eventName: "mute",
            sourceConnectorType: 1,
            data: {
              mute: lastMuted.value,
            },
            playerId: playerNonce,
          },
          location.origin
        )
        status.value = "play"
      }
      if (data.data.isVideoMetaDataLoaded && status.value === "load") {
        log.info(`Seeking to ${targetTime} to load video`)
        player.value.contentWindow?.postMessage(
          {
            eventName: "seek",
            sourceConnectorType: 1,
            playerId: playerNonce,
            data: { time: targetTime },
          },
          location.origin
        )
        status.value = "presync"
      }
      if (status.value === "play") {
        lastMuted.value = data.data.muted
      }
      break
    }
    default: {
      // log.log("Discarding message", data)
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
      'bg-black': status === 'play',
    }"
  >
    <div
      v-if="store.debug"
      class="absolute top-0 right-0 p-2 bg-white/50 text-black text-xs z-10"
    >
      Server time: {{ serverTime }}<br />
      Time delay: {{ store.delay }}<br />
      Status: {{ status }}<br />
      Muted: {{ lastMuted }}
    </div>
    <iframe
      v-if="videoId"
      ref="player"
      :key="nonce"
      :src
      class="block absolute w-full h-full"
    />
    <template v-else-if="store.session.startedAt === 0">
      <h1 class="text-2xl">同期中...</h1>
    </template>
    <template v-else>
      <h1 class="text-2xl">待機中...</h1>
      <p v-if="store.canQueue" class="hidden sm:block">
        右の欄から動画を再生できます。
      </p>
      <p v-if="store.canQueue" class="hidden xs:max-sm:block">
        キュー画面から動画を再生できます。
      </p>
    </template>
  </div>
</template>
<style lang="scss"></style>
