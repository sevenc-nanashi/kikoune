<script setup lang="ts">
import consola from "consola"
import { ref, watch } from "vue"
import { v4 as uuid } from "uuid"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"
import { SessionVideo, Video } from "~types/type"
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
  const videoId = videoSource.match(/sm\d+/)
  if (!videoId) {
    spawnPopup("無効な動画IDです。", "error")
    return
  }
  consola.info("Adding video", videoSource)

  try {
    isSubmitting.value = true

    const res = await fetch(`/api/room/${discordSdk.instanceId}/queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${store.me.id} ${store.token}`,
      },
      body: JSON.stringify({
        videoId: videoId[0],
      }),
    })
    if (!res.ok) {
      consola.error("Failed to queue video")
      spawnPopup(`動画${videoId[0]}の追加に失敗しました。`, "error")
      return
    }

    videoSourceInput.value.value = ""
    const { video }: { video: Video } = await res.json()
    temporaryAdded.value.push({
      ...video,
      requestedBy: store.me.id,
      nonce: uuid(),
    })

    spawnPopup(`「${video.title}」を追加しました。`, "info")
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
      spawnPopup(`「${video.title}」の削除に失敗しました。`, "error")
      return
    }

    temporaryDeleted.value.push(video.nonce)

    spawnPopup(`「${video.title}」を削除しました。`, "info")
  } finally {
    isSubmitting.value = false
  }
}

const openExternal = (url: string) => {
  discordSdk.commands.openExternalLink({ url })
}
</script>
<template>
  <div class="bg-black/10 relative flex-grow flex flex-col">
    <div
      class="flex-grow flex flex-col relative h-full overflow-x-hidden overflow-y-scroll gap-1"
      :class="{
        'grid place-content-center': store.session.queue.length === 0,
      }"
    >
      <p v-if="store.session.queue.length === 0" class="text-xl">
        キューは空です。
      </p>
      <div
        v-for="(video, i) in store.session.queue
          .filter((video) => !temporaryDeleted.includes(video.nonce))
          .concat(temporaryAdded)"
        :key="video.id"
        class="bg-black/25 flex gap-2"
      >
        <div class="w-8 h-full bg-black/50 grid place-content-center">
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
          v-if="video.requestedBy === store.me.id"
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
    <form class="w-full flex relative" @submit.prevent="onSubmit">
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
        placeholder="動画のID（sm123456789）またはURLを入力してください。"
      />
      <TooltipIcon
        name="md-send"
        class="h-full w-12 bg-blue-500 p-3"
        tooltip="送信"
      />
    </form>
  </div>
</template>
<style scoped lang="scss"></style>
