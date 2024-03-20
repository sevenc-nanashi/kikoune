<script setup lang="ts">
import { v4 as uuid } from "uuid"
import { computed, ref, onMounted, onUnmounted } from "vue"
import { PlayerMetadata, VideoInfo } from "~/lib/nicoTypes"

const props = defineProps<{
  id: string
}>()
const emit = defineEmits<{
  (
    e: "loadComplete",
    data: {
      videoInfo: VideoInfo
    }
  ): void
  (e: "playerMetadataChange", data: PlayerMetadata): void
  (
    e: "playerStatusChange",
    data: {
      playerStatus: number
    }
  ): void
  (e: "statusChange", data: { playerStatus: number; seekStatus: number }): void
}>()
const player = ref<HTMLIFrameElement | undefined>(undefined)
const nonce = uuid()
const src = computed(
  () =>
    `/nico/nico-embed/${props.id}?${new URLSearchParams({
      jsapi: "1",
      playerId: nonce,
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

const onMessage = (event: MessageEvent) => {
  if (event.origin !== location.origin) {
    return
  }
  const data = event.data
  emit(data.eventName, data.data)
}
onMounted(() => {
  window.addEventListener("message", onMessage)
})
onUnmounted(() => {
  window.removeEventListener("message", onMessage)
})
</script>
<template>
  <div class="relative">
    <iframe ref="player" :src class="block absolute w-full h-full"></iframe>
  </div>
</template>
<style lang="scss"></style>
