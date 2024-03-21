<script setup lang="ts">
import consola from "consola"
import { computed, ref, watch } from "vue"
import { v4 as uuid } from "uuid"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"
import { SessionVideo, Video } from "~shared/schema"
import TooltipIcon from "~/components/TooltipIcon.vue"

const store = useStore()
const discordSdk = useDiscordSdk()

const isSubmitting = ref(false)
const videoSourceInput = ref<HTMLInputElement>()
const popup = ref<string | undefined>()
const popupType = ref<"error" | "info">("error")
const popupCount = ref(0)
const spawnPopup = (message: string, type: "error" | "info") => {
  popup.value = message
  popupType.value = type
  popupCount.value++
  setTimeout(() => {
    popupCount.value--
  }, 5000)
}
const temporaryAdded = ref<SessionVideo[]>([])
const temporaryDeleted = ref<string[]>([])
const queue = computed(() =>
  store.session.queue
    .filter((video) => !temporaryDeleted.value.includes(video.nonce))
    .concat(temporaryAdded.value)
)
watch(
  () => store.session.queue,
  () => {
    temporaryAdded.value = []
    temporaryDeleted.value = []
  }
)

const onSubmit = async () => {
  if (isSubmitting.value) return
  if (!videoSourceInput.value) return

  const videoSource = videoSourceInput.value.value
  const videoIds = [...videoSource.matchAll(/(?:sm|so)\d+/g)]
  if (!videoIds.length) {
    spawnPopup("無効な動画IDです。", "error")
    return
  }
  consola.info("Adding video", videoSource)

  try {
    isSubmitting.value = true

    const videos: Video[] = []
    for (const [videoId] of videoIds) {
      const res = await fetch(`/api/room/${discordSdk.instanceId}/queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${store.me.id} ${store.token}`,
        },
        body: JSON.stringify({
          videoId: videoId,
        }),
      })
      if (!res.ok) {
        consola.error("Failed to queue video")
        spawnPopup(`動画${videoId}の追加に失敗しました。`, "error")
        return
      }

      videoSourceInput.value.value = ""
      const { video }: { video: Video } = await res.json()
      temporaryAdded.value.push({
        ...video,
        requestedBy: store.me.id,
        nonce: uuid(),
      })
      videos.push(video)
    }

    if (videos.length === 1) {
      spawnPopup(`「${videos[0].title}」を追加しました。`, "info")
    } else {
      spawnPopup(`${videos.length}件の動画を追加しました。`, "info")
    }
  } finally {
    isSubmitting.value = false
  }
}
const deleteVideo = async (video: SessionVideo) => {
  if (isSubmitting.value) return
  consola.info("Deleting video", video.id)

  try {
    isSubmitting.value = true

    const res = await fetch(
      `/api/room/${discordSdk.instanceId}/queue/${video.nonce}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${store.me.id} ${store.token}`,
        },
      }
    )
    if (!res.ok) {
      consola.error("Failed to delete video")
      spawnPopup(`「${video.title}」のキャンセルに失敗しました。`, "error")
      return
    }

    temporaryDeleted.value.push(video.nonce)

    spawnPopup(`「${video.title}」をキャンセルしました。`, "info")
  } finally {
    isSubmitting.value = false
  }
}

const openExternal = (url: string) => {
  discordSdk.commands.openExternalLink({ url })
}
</script>
<template>
  <div class="bg-black/25 h-full w-full relative flex flex-col">
    <div
      class="flex-grow flex flex-col relative gap-1"
      :class="{
        'grid place-content-center': queue.length === 0,
      }"
    >
      <p v-if="queue.length === 0" class="text-xl">キューは空です。</p>
      <div
        v-for="(video, i) in queue"
        :key="video.id"
        class="bg-black/50 flex gap-2 relative"
      >
        <div class="w-8 bg-black grid place-content-center">
          {{ temporaryAdded.includes(video) ? "-" : i + 1 }}
        </div>
        <div class="flex p-2 gap-1 flex-col flex-grow">
          <div class="flex flex-row items-end relative">
            <div class="text-md">{{ video.title }}</div>
            <div class="pl-4 font-light text-xs">{{ video.author }}</div>
          </div>
          <div class="text-xs flex flex-row items-center">
            <img
              class="rounded-full h-5 mr-1 inline"
              :src="store.getAvatarUrl(video.requestedBy)"
            />
            <span class="text-cyan-500">{{
              store.getName(video.requestedBy) ?? "（不明）"
            }}</span
            >さんのリクエスト
          </div>
        </div>

        <TooltipIcon
          v-if="store.isHost || video.requestedBy === store.me.id"
          class="self-center cursor-pointer h-[75%] aspect-square grid place-items-center p-3"
          name="md-delete"
          tooltip="削除"
          @click="deleteVideo(video)"
        />
        <TooltipIcon
          class="self-center cursor-pointer h-[75%] aspect-square grid place-items-center p-3"
          name="md-openinnew"
          tooltip="開く"
          @click="openExternal(`https://www.nicovideo.jp/watch/${video.id}`)"
        />
      </div>
    </div>
    <form
      class="w-full flex sticky bottom-0 h-12 queue-form"
      @submit.prevent="onSubmit"
    >
      <div
        class="absolute inset-0 bg-slate-500/25 transition-opacity z-10"
        :style="{
          pointerEvents: isSubmitting ? 'auto' : 'none',
          opacity: isSubmitting ? 1 : 0,
        }"
      />
      <div
        class="absolute w-full h-full top-[-100%] left-0 bg-black transition-opacity pointer-events-none grid place-content-center"
        :class="{
          'text-red-500': popupType === 'error',
          'text-green-500': popupType === 'info',
        }"
        :style="{ opacity: popupCount > 0 ? 1 : 0 }"
      >
        {{ popup }}
      </div>
      <input
        ref="videoSourceInput"
        class="bg-white p-2 text-slate-950 outline-none flex-grow"
        placeholder="動画のID（sm123456789）/  URL（複数可）"
      />
      <input
        type="submit"
        class="h-full bg-black p-1 w-24 cursor-pointer active:bg-cyan-500"
        label="追加"
      />
    </form>
  </div>
</template>
<style scoped lang="scss"></style>
