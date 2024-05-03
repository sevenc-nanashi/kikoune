<script setup lang="ts">
import consola from "consola/browser"
import { computed, ref, watch } from "vue"
import { v4 as uuid } from "uuid"
import Draggable from "vuedraggable"
import { SessionVideo, Video } from "@kikoune/shared"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"
import TooltipIcon from "~/components/TooltipIcon.vue"
import { toExternal } from "~/lib/external"

const store = useStore()
const discordSdk = useDiscordSdk()
const log = consola.withTag("QueueList")

const isSubmitting = ref(false)
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

const videoIdPattern = /(?:sm|so)\d+/g

const videoSource = ref<string>("")
const buttonState = computed<"submit" | "search" | "close">(() => {
  if (
    searchResult.value.length > 0 &&
    (searchQuery.value === videoSource.value || videoSource.value === "")
  ) {
    return "close"
  } else if (!videoSource.value) {
    return "search"
  } else if (videoSource.value.match(videoIdPattern)) {
    return "submit"
  } else {
    return "search"
  }
})
const onSubmit = async () => {
  if (buttonState.value === "close") {
    searchResult.value = []
    searchQuery.value = ""
    return
  } else if (videoSource.value === "") {
    return
  } else if (buttonState.value === "search") {
    searchVideo()
  } else {
    const videoIds = [...videoSource.value.matchAll(videoIdPattern)]
    if (!videoIds.length) {
      spawnPopup("無効な動画IDです。", "error")
      return
    }

    addToQueue(videoIds.map((match) => match[0]))
  }
}
const searchResult = ref<
  {
    contentId: string
    title: string
    thumbnailUrl: string
  }[]
>([])
const searchQuery = ref("")
const searchVideo = async () => {
  if (isSubmitting.value) return
  try {
    isSubmitting.value = true
    const param = new URLSearchParams({
      q: videoSource.value,
      targets: "title,description,tags",
      fields: "contentId,title,thumbnailUrl",
      _sort: "-viewCounter",
      _limit: "10",
    })
    log.info(`Searching videos with ${param}`)
    const resp = await fetch(
      `/external/snapshot-search-nicovideo-jp/api/v2/snapshot/video/contents/search?${param}`,
      {
        headers: {
          "User-Agent": "Kikoune",
        },
      }
    ).then((res) => res.json())
    if (resp.meta.status !== 200) {
      log.error("Failed to search videos")
      spawnPopup("動画の検索に失敗しました。", "error")
      return
    }
    if (resp.data.length === 0) {
      spawnPopup("該当する動画が見つかりませんでした。", "error")
      return
    }
    searchQuery.value = videoSource.value
    searchResult.value = resp.data
  } finally {
    isSubmitting.value = false
  }
}
const confirmSearch = async (contentId: string) => {
  addToQueue([contentId]).then(() => {
    searchResult.value = []
    searchQuery.value = ""
  })
}
const addToQueue = async (videoIds: string[]) => {
  if (isSubmitting.value) return

  log.info("Adding video", videoIds)
  try {
    isSubmitting.value = true

    const videos: Video[] = []
    for (const videoId of videoIds) {
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

      videoSource.value = ""
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
const placeholder = computed(() => {
  if (store.canQueue) {
    return "キーワード / ID / URL（複数可）"
  } else if (store.session.queue.length >= store.sessionSetting.queueLimit) {
    return `キューの上限（${store.sessionSetting.queueLimit}曲）に達しました。`
  } else {
    return "ホスト以外はキューに追加できません。"
  }
})
</script>
<template>
  <div class="bg-black/25 h-full w-full relative flex flex-col">
    <div
      v-if="searchResult.length > 0"
      class="flex-grow flex flex-col relative gap-1 h-screen pt-1 xs:max-sm:pb-20 pb-1 sm:h-auto overflow-y-scroll"
    >
      <p class="text-xl">「{{ searchQuery }}」の検索結果</p>
      <div
        v-if="isSubmitting"
        class="bg-slate-500/25 absolute inset-0 cursor-wait z-10"
      />
      <div
        v-for="(video, i) in searchResult"
        :key="i"
        class="flex flex-row gap-1 relative"
      >
        <div class="w-16 h-16 rounded-md overflow-hidden relative">
          <div
            class="bg-cover bg-center absolute inset-[-1rem]"
            :style="{
              backgroundImage: `url(${toExternal(video.thumbnailUrl)})`,
            }"
          />
        </div>
        <div
          class="flex bg-black/50 hover:bg-black cursor-pointer items-center w-[calc(100%_-_4.25rem)] p-2"
          @click="confirmSearch(video.contentId)"
        >
          <div class="text-md">{{ video.title }}</div>
        </div>
      </div>
    </div>
    <div
      v-else-if="queue.length === 0"
      class="grid place-content-center flex-grow"
    >
      <p class="text-xl">キューは空です。</p>
    </div>
    <div
      v-else-if="!store.isHost && store.sessionSetting.queueHidden"
      class="grid place-content-center flex-grow"
    >
      <p class="text-xl">キューは非表示にされています。</p>
    </div>
    <Draggable
      v-else
      v-model="queue"
      item-key="nonce"
      :handle="store.sessionSetting.random ? '.__disabled__' : '.handle'"
      class="flex-grow flex flex-col relative gap-1 h-screen pt-1 xs:max-sm:pb-20 pb-1 sm:h-auto overflow-y-scroll overflow-x-hidden"
      @sort="setReordered"
    >
      <template v-if="store.isHost && !store.sessionSetting.random" #header>
        <p class="pl-2">数字をドラッグして順番を変更できます。</p>
      </template>
      <template #item="{ element: video, index: i }">
        <div class="bg-black/50 flex gap-2 relative">
          <div
            class="w-8 bg-black grid place-content-center transition-colors duration-200"
            :class="{
              'handle cursor-grab':
                !temporaryAdded.includes(video) &&
                store.isHost &&
                !store.sessionSetting.random,
              'text-opacity-50': temporaryAdded.includes(video),
              '!bg-cyan-900':
                !temporaryAdded.includes(video) &&
                highlightReordered &&
                reorderedItems.includes(video.nonce),
            }"
          >
            {{
              temporaryAdded.includes(video)
                ? "-"
                : store.sessionSetting.random
                  ? "?"
                  : i + 1
            }}
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

    <div
      class="absolute w-full p-2 h-16 bottom-8 left-0 bg-black transition-opacity pointer-events-none grid place-content-center"
      :class="{
        'text-red-500': popupType === 'error',
        'text-green-500': popupType === 'info',
      }"
      :style="{ opacity: popupCount > 0 ? 1 : 0 }"
    >
      {{ popup }}
    </div>
    <form
      class="w-full flex h-8 queue-form relative z-50"
      @submit.prevent="onSubmit"
    >
      <div
        class="absolute inset-0 bg-slate-500/25 transition-opacity z-50"
        :style="{
          pointerEvents: isSubmitting ? 'auto' : 'none',
          opacity: isSubmitting ? 1 : 0,
        }"
      />
      <input
        v-model="videoSource"
        :disabled="!store.canQueue"
        class="bg-white p-2 text-slate-950 outline-none flex-grow rounded-none w-[calc(100%_-_4rem)] sm:w-auto"
        :class="{
          'cursor-not-allowed opacity-50': !store.canQueue,
        }"
        :placeholder
      />
      <button
        :disabled="!store.canQueue"
        type="submit"
        class="h-full bg-black px-4 sm:p-1 w-16 rounded-none"
        :class="{
          'cursor-pointer active:bg-cyan-500': store.canQueue,
          'opacity-50 cursor-not-allowed': !store.canQueue,
        }"
      >
        {{
          buttonState === "search"
            ? "検索"
            : buttonState === "submit"
              ? "追加"
              : "戻る"
        }}
      </button>
    </form>
  </div>
</template>
<style scoped lang="scss"></style>
