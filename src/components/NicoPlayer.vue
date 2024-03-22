<script setup lang="ts">
import consola from "consola"
import { v4 as uuid } from "uuid"
import { computed, ref, onMounted, onUnmounted, watch } from "vue"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"
import { buffer } from "~shared/const"

const store = useStore()
const discordSdk = useDiscordSdk()
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
      noShare: "1",
      noVideoDetail: "0",
      allowProgrammaticFullScreen: "1",
      noIncrementViewCount: "0",
      persistence: "1",
      disableAdCheck: "0",
      referer: location.href,
    })}`
)

let firstSeekDone = false
let mainSeekDone = false
let willSeek = false
let lastStatus = 0
watch(
  nonce,
  () => {
    consola.info("Nonce changed, resetting seek flags")
    firstSeekDone = false
    mainSeekDone = false
    willSeek = false
  },
  { immediate: true }
)
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
      consola.info("Player load complete, playing")
      player.value.contentWindow?.postMessage(
        {
          eventName: "play",
          sourceConnectorType: 1,
          playerId: playerNonce,
        },
        location.origin
      )
      lastStatus = 1
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
        url = url.replace(location.origin + "/external", "")
        const dummyHost = url.split("/")[0]
        url = "https://" + url.replace(dummyHost, dummyHost.replace(/\./g, "-"))
      }
      discordSdk.commands.openExternalLink({ url })
      break
    }
    case "statusChange": {
      consola.info(
        `Status changed to ${data.data.playerStatus} / ${data.data.seekStatus}`
      )
      lastStatus = data.data.playerStatus
      if (data.data.playerStatus === 2) {
        if (!willSeek) {
          consola.info("Flagged willSeek")
        }

        willSeek = true
      }
      break
    }
    case "playerMetadataChange": {
      const targetTime = Date.now() - store.session.startedAt - buffer
      if (targetTime < 0) {
        return
      }
      if (
        data.data.maximumBuffered > targetTime &&
        !mainSeekDone &&
        firstSeekDone &&
        lastStatus === 2
      ) {
        const isIphone = navigator.userAgent.match(/iPhone/i)
        const isAndroid = navigator.userAgent.match(/Android/i)
        consola.info(`Seeking to ${targetTime} to sync`)
        player.value.contentWindow?.postMessage(
          {
            eventName: "seek",
            sourceConnectorType: 1,
            playerId: playerNonce,

            data: {
              // TODO: 環境に合わせてチューニングするようにする
              time: isIphone
                ? targetTime + 2500
                : isAndroid
                  ? targetTime + 1500
                  : targetTime,
            },
          },
          location.origin
        )
        mainSeekDone = true
      }
      if (data.data.isVideoMetaDataLoaded && !firstSeekDone && willSeek) {
        consola.info(`Seeking to ${targetTime} to load video`)
        player.value.contentWindow?.postMessage(
          {
            eventName: "seek",
            sourceConnectorType: 1,
            playerId: playerNonce,
            data: { time: targetTime },
          },
          location.origin
        )
        firstSeekDone = true
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
      <p class="hidden xs:max-sm:block">キュー画面から動画を再生できます。</p>
    </template>
  </div>
</template>
<style lang="scss"></style>
