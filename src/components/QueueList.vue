<script setup lang="ts">
import consola from "consola/browser"
import { computed, ref, watch } from "vue"
import { v4 as uuid } from "uuid"
import Draggable from "vuedraggable"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"
import { SessionVideo, Video } from "~shared/schema"
import TooltipIcon from "~/components/TooltipIcon.vue"

const store = useStore()
const discordSdk = useDiscordSdk()
const log = consola.withTag("QueueList")

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
const temporaryOrder = ref<string[] | undefined>(undefined)
const temporaryAdded = ref<SessionVideo[]>([])
const temporaryDeleted = ref<string[]>([])
const reorderedItems = ref<string[]>([])
const reorderedCount = ref(0)
const highlightReordered = computed(() => reorderedCount.value > 0)
const queue = computed({
  get: () =>
    (temporaryOrder.value
      ? temporaryOrder.value.flatMap((nonce) => {
          const video = store.session.queue.find(
            (video) => video.nonce === nonce
          )
          return video ? [video] : []
        })
      : store.session.queue
    )
      .filter((video) => !temporaryDeleted.value.includes(video.nonce))
      .concat(temporaryAdded.value),
  set: (value: SessionVideo[]) => {
    temporaryOrder.value = value.map((video) => video.nonce)
    sendReorder()
  },
})
watch(
  () => store.session.queue,
  () => {
    temporaryOrder.value = undefined
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
  log.info("Adding video", videoSource)

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
        log.error("Failed to queue video")
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
  log.info("Deleting video", video.id)

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
      log.error("Failed to delete video")
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
const setReordered = (event: { newIndex: number; oldIndex: number }) => {
  const earlierIndex =
    (event.oldIndex < event.newIndex ? event.oldIndex : event.newIndex) - 1
  const laterIndex =
    (event.oldIndex < event.newIndex ? event.newIndex : event.oldIndex) - 1
  reorderedItems.value = queue.value
    .slice(earlierIndex, laterIndex + 1)
    .map((video) => video.nonce)
  log.info(`Reordered ${earlierIndex} ... ${laterIndex}`)

  reorderedCount.value++
  setTimeout(() => {
    reorderedCount.value--
  }, 1000)
}
const sendReorder = async () => {
  if (temporaryOrder.value) {
    log.info("Sending reorder", temporaryOrder.value)
    const res = await fetch(`/api/room/${discordSdk.instanceId}/queue`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${store.me.id} ${store.token}`,
      },
      body: JSON.stringify({
        order: temporaryOrder.value,
      }),
    })
    if (!res.ok) {
      log.error("Failed to reorder")
      spawnPopup("順番の変更に失敗しました。", "error")
    }
  }
}
</script>
<template>
  <div class="bg-black/25 h-full w-full relative flex flex-col">
    <div v-if="queue.length === 0" class="grid place-content-center flex-grow">
      <p class="text-xl">キューは空です。</p>
    </div>
    <Draggable
      v-else
      v-model="queue"
      item-key="nonce"
      handle=".handle"
      class="flex-grow flex flex-col relative gap-1 h-screen pt-1 xs:max-sm:pb-32 pb-2 sm:h-auto overflow-x-hidden overflow-y-scroll sm:overflow-y-auto"
      @sort="setReordered"
    >
      <template v-if="store.isHost" #header>
        <p class="pl-2">数字をドラッグして順番を変更できます。</p>
      </template>
      <template #item="{ element: video, index: i }">
        <div class="bg-black/50 flex gap-2 relative">
          <div
            class="w-8 bg-black grid place-content-center transition-colors duration-200"
            :class="{
              'handle cursor-grab':
                !temporaryAdded.includes(video) && store.isHost,
              'text-opacity-50': temporaryAdded.includes(video),
              '!bg-cyan-900':
                !temporaryAdded.includes(video) &&
                highlightReordered &&
                reorderedItems.includes(video.nonce),
            }"
          >
            {{ temporaryAdded.includes(video) ? "-" : i + 1 }}
          </div>
          <div class="flex p-2 gap-2 sm:gap-1 flex-col flex-grow">
            <div class="flex flex-col sm:flex-row sm:items-end relative">
              <div class="text-md">{{ video.title }}</div>
              <div class="sm:pl-4 font-light text-xs">{{ video.author }}</div>
            </div>
            <div class="text-xs flex flex-row items-center">
              <img
                class="rounded-full h-5 mr-1 inline"
                :src="store.getAvatarUrl(video.requestedBy)"
              />
              <span class="text-cyan-500">{{
                store.getName(video.requestedBy)
              }}</span
              >さんのリクエスト
            </div>

            <div class="flex sm:hidden flex-row gap-2">
              <TooltipIcon
                v-if="store.isHost || video.requestedBy === store.me.id"
                class="self-center cursor-pointer h-full aspect-square grid place-items-center"
                name="md-delete"
                tooltip="削除"
                @click="deleteVideo(video)"
              />
              <TooltipIcon
                class="self-center cursor-pointer h-full aspect-square grid place-items-center"
                name="md-openinnew"
                tooltip="開く"
                @click="
                  openExternal(`https://www.nicovideo.jp/watch/${video.id}`)
                "
              />
            </div>
          </div>

          <div class="flex-row hidden sm:flex pr-2">
            <TooltipIcon
              v-if="store.isHost || video.requestedBy === store.me.id"
              class="self-center cursor-pointer h-3/4 aspect-square grid place-items-center p-3"
              name="md-delete"
              tooltip="削除"
              @click="deleteVideo(video)"
            />
            <TooltipIcon
              class="self-center cursor-pointer h-3/4 aspect-square grid place-items-center p-3"
              name="md-openinnew"
              tooltip="開く"
              @click="
                openExternal(`https://www.nicovideo.jp/watch/${video.id}`)
              "
            />
          </div>
        </div>
      </template>
    </Draggable>
    <form class="w-full flex h-12 md:h-8 queue-form" @submit.prevent="onSubmit">
      <div
        class="absolute inset-0 bg-slate-500/25 transition-opacity z-10"
        :style="{
          pointerEvents: isSubmitting ? 'auto' : 'none',
          opacity: isSubmitting ? 1 : 0,
        }"
      />
      <div
        class="absolute w-full h-full py-2 top-[-100%] left-0 bg-black transition-opacity pointer-events-none grid place-content-center"
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
        class="bg-white p-2 text-slate-950 outline-none flex-grow rounded-none w-[calc(100%_-_4rem)] sm:w-auto"
        placeholder="動画のID（sm123456789）/  URL（複数可）"
      />
      <input
        type="submit"
        class="h-full bg-black px-4 sm:p-1 w-16 cursor-pointer active:bg-cyan-500 rounded-none"
        label="追加"
      />
    </form>
  </div>
</template>
<style scoped lang="scss"></style>
