<script setup lang="ts">
import { SessionVideo, Video } from "@kikoune/shared";
import consola from "consola/browser";
import { v4 as uuid } from "uuid";
import { computed, ref, watch } from "vue";
import Draggable from "vuedraggable";

import TooltipIcon from "~/components/TooltipIcon.vue";
import { toExternal } from "~/lib/external";
import { useDiscordSdk } from "~/plugins/useDiscordSdk";
import { useStore } from "~/store";

const store = useStore();
const discordSdk = useDiscordSdk();
const log = consola.withTag("QueueList");

const isSubmitting = ref(false);
const popup = ref<string | undefined>();
const popupType = ref<"error" | "info">("error");
const popupCount = ref(0);
const spawnPopup = (message: string, type: "error" | "info") => {
  popup.value = message;
  popupType.value = type;
  popupCount.value++;
  setTimeout(() => {
    popupCount.value--;
  }, 5000);
};
const temporaryOrder = ref<string[] | undefined>(undefined);
const temporaryAdded = ref<SessionVideo[]>([]);
const temporaryDeleted = ref<string[]>([]);
const reorderedItems = ref<string[]>([]);
const reorderedCount = ref(0);
const highlightReordered = computed(() => reorderedCount.value > 0);
const queue = computed({
  get: () =>
    (temporaryOrder.value
      ? temporaryOrder.value.flatMap((nonce) => {
          const video = store.session.queue.find((video) => video.nonce === nonce);
          return video ? [video] : [];
        })
      : store.session.queue
    )
      .filter((video) => !temporaryDeleted.value.includes(video.nonce))
      .concat(temporaryAdded.value),
  set: (value: SessionVideo[]) => {
    temporaryOrder.value = value.map((video) => video.nonce);
    sendReorder();
  },
});
watch(
  () => store.session.queue,
  () => {
    temporaryOrder.value = undefined;
    temporaryAdded.value = [];
    temporaryDeleted.value = [];
  },
);

const videoIdPattern = /(?:sm|so|ss)\d+/g;

const videoSource = ref<string>("");
const buttonState = computed<"submit" | "search" | "close">(() => {
  if (
    searchResult.value.length > 0 &&
    (searchQuery.value === videoSource.value || videoSource.value === "")
  ) {
    return "close";
  } else if (!videoSource.value) {
    return "search";
  } else if (videoSource.value.match(videoIdPattern)) {
    return "submit";
  } else {
    return "search";
  }
});
const onSubmit = async () => {
  if (buttonState.value === "close") {
    searchResult.value = [];
    searchQuery.value = "";
    return;
  } else if (videoSource.value === "") {
    return;
  } else if (buttonState.value === "search") {
    searchVideo();
  } else {
    const videoIds = [...videoSource.value.matchAll(videoIdPattern)];
    if (!videoIds.length) {
      spawnPopup("無効な動画IDです。", "error");
      return;
    }

    addToQueue(videoIds.map((match) => match[0]));
  }
};
const searchResult = ref<
  {
    contentId: string;
    title: string;
    thumbnailUrl: string;
  }[]
>([]);
const searchQuery = ref("");
const searchVideo = async () => {
  if (isSubmitting.value) return;
  try {
    isSubmitting.value = true;
    const param = new URLSearchParams({
      q: videoSource.value,
      targets: "title,description,tags",
      fields: "contentId,title,thumbnailUrl",
      _sort: "-viewCounter",
      _limit: "10",
    });
    log.info(`Searching videos with ${param}`);
    const resp = await fetch(
      `/.proxy/external/snapshot--search--nicovideo--jp/api/v2/snapshot/video/contents/search?${param}`,
      {
        headers: {
          "User-Agent": "Kikoune",
        },
      },
    ).then((res) => res.json());
    if (resp.meta.status !== 200) {
      log.error("Failed to search videos");
      spawnPopup("動画の検索に失敗しました。", "error");
      return;
    }
    if (resp.data.length === 0) {
      spawnPopup("該当する動画が見つかりませんでした。", "error");
      return;
    }
    searchQuery.value = videoSource.value;
    searchResult.value = resp.data;
  } finally {
    isSubmitting.value = false;
  }
};
const confirmSearch = async (contentId: string) => {
  addToQueue([contentId]).then(() => {
    searchResult.value = [];
    searchQuery.value = "";
  });
};
const addToQueue = async (videoIds: string[]) => {
  if (isSubmitting.value) return;

  log.info("Adding video", videoIds);
  try {
    isSubmitting.value = true;

    const videos: Video[] = [];
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
      });
      if (!res.ok) {
        log.error("Failed to queue video");
        spawnPopup(`動画${videoId}の追加に失敗しました。`, "error");
        return;
      }

      videoSource.value = "";
      const { video }: { video: Video } = await res.json();
      temporaryAdded.value.push({
        ...video,
        requestedBy: store.me.id,
        nonce: uuid(),
      });
      videos.push(video);
    }

    if (videos.length === 1) {
      spawnPopup(`「${videos[0].title}」を追加しました。`, "info");
    } else {
      spawnPopup(`${videos.length}件の動画を追加しました。`, "info");
    }
  } finally {
    isSubmitting.value = false;
  }
};
const deleteVideo = async (video: SessionVideo) => {
  if (isSubmitting.value) return;
  log.info("Deleting video", video.id);

  try {
    isSubmitting.value = true;

    const res = await fetch(`/api/room/${discordSdk.instanceId}/queue/${video.nonce}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${store.me.id} ${store.token}`,
      },
    });
    if (!res.ok) {
      log.error("Failed to delete video");
      spawnPopup(`「${video.title}」のキャンセルに失敗しました。`, "error");
      return;
    }

    temporaryDeleted.value.push(video.nonce);

    spawnPopup(`「${video.title}」をキャンセルしました。`, "info");
  } finally {
    isSubmitting.value = false;
  }
};

const openExternal = (url: string) => {
  discordSdk.commands.openExternalLink({ url });
};
const setReordered = (event: { newIndex: number; oldIndex: number }) => {
  const earlierIndex = (event.oldIndex < event.newIndex ? event.oldIndex : event.newIndex) - 1;
  const laterIndex = (event.oldIndex < event.newIndex ? event.newIndex : event.oldIndex) - 1;
  reorderedItems.value = queue.value
    .slice(earlierIndex, laterIndex + 1)
    .map((video) => video.nonce);
  log.info(`Reordered ${earlierIndex} ... ${laterIndex}`);

  reorderedCount.value++;
  setTimeout(() => {
    reorderedCount.value--;
  }, 1000);
};
const sendReorder = async () => {
  if (temporaryOrder.value) {
    log.info("Sending reorder", temporaryOrder.value);
    const res = await fetch(`/api/room/${discordSdk.instanceId}/queue`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${store.me.id} ${store.token}`,
      },
      body: JSON.stringify({
        order: temporaryOrder.value,
      }),
    });
    if (!res.ok) {
      log.error("Failed to reorder");
      spawnPopup("順番の変更に失敗しました。", "error");
    }
  }
};
const placeholder = computed(() => {
  if (store.canQueue) {
    return "キーワード / ID / URL（複数可）";
  } else if (store.session.queue.length >= store.sessionSetting.queueLimit) {
    return `キューの上限（${store.sessionSetting.queueLimit}曲）に達しました。`;
  } else {
    return "ホスト以外はキューに追加できません。";
  }
});
</script>
<template>
  <div un-h="full" un-w="full" un-relative un-flex="~ col" un-pb="8">
    <div
      v-if="searchResult.length > 0"
      un-flex-grow
      un-flex="~ col"
      un-relative
      un-gap="1"
      un-pt="1"
      un-pb="1"
      un-overflow-y="auto"
    >
      <p un-text="xl">「{{ searchQuery }}」の検索結果</p>
      <div
        v-if="isSubmitting"
        un-bg="slate-500/25"
        un-absolute
        un-inset="0"
        un-cursor="wait"
        un-z="10"
      />
      <div v-for="(video, i) in searchResult" :key="i" un-flex="~ row" un-gap="1" un-relative>
        <div un-w="16" un-h="16" un-rounded="md" un-overflow="hidden" un-relative>
          <div
            un-bg="cover center"
            un-absolute
            un-inset="[-1rem]"
            :style="{
              backgroundImage: `url(${toExternal(video.thumbnailUrl)})`,
            }"
          />
        </div>
        <div
          un-flex
          un-bg="black/50 hover:black"
          un-cursor="pointer"
          un-items="center"
          un-w="[calc(100%_-_4.25rem)]"
          un-p="2"
          @click="confirmSearch(video.contentId)"
        >
          <div un-text="md">{{ video.title }}</div>
        </div>
      </div>
    </div>
    <div v-else-if="queue.length === 0" un-grid un-place-content="center" un-flex-grow>
      <p un-text="xl">キューは空です。</p>
    </div>
    <div
      v-else-if="!store.isHost && store.sessionSetting.queueHidden"
      un-grid
      un-place-content="center"
      un-flex-grow
    >
      <p un-text="xl">キューは非表示にされています。</p>
    </div>
    <Draggable
      v-else
      v-model="queue"
      item-key="nonce"
      :handle="store.sessionSetting.random ? '.__disabled__' : '.handle'"
      :componentData="{
        'un-flex-grow': true,
        'un-flex': '~ col',
        'un-relative': true,
        'un-gap': '1',
        'un-pt': '1',
        'un-pb': '1',
        'un-overflow-y': 'auto',
        'un-overflow-x': 'hidden',
      }"
      @sort="setReordered"
    >
      <template #header>
        <p v-if="store.isHost && !store.sessionSetting.random" un-pl="2">
          数字をドラッグして順番を変更できます。
        </p>
        <p v-if="store.sessionSetting.random" un-pl="2">ランダム再生が有効です。</p>
      </template>
      <template #item="{ element: video, index: i }">
        <div un-bg="black/50" un-flex="~ row" un-gap="2" un-relative>
          <div
            un-w="8"
            :un-bg="
              !temporaryAdded.includes(video) &&
              highlightReordered &&
              reorderedItems.includes(video.nonce)
                ? 'cyan-900'
                : 'black'
            "
            un-grid
            un-place-content="center"
            un-transition="colors"
            un-duration="200"
            :class="{
              handle:
                !temporaryAdded.includes(video) && store.isHost && !store.sessionSetting.random,
            }"
            :un-cursor="
              !temporaryAdded.includes(video) && store.isHost && !store.sessionSetting.random
                ? 'grab'
                : null
            "
            :un-text-opacity="temporaryAdded.includes(video) ? '50' : null"
          >
            {{ temporaryAdded.includes(video) ? "-" : store.sessionSetting.random ? "?" : i + 1 }}
          </div>
          <div un-flex="~ col" un-p="2" un-gap="2 sm:1" un-flex-grow>
            <div un-flex="~ col sm:row" un-items="sm:end" un-relative>
              <div un-text="md">{{ video.title }}</div>
              <div un-pl="sm:4" un-font="light" un-text="xs">{{ video.author }}</div>
            </div>
            <div un-text="xs" un-flex="~ row" un-items="center">
              <img
                un-rounded="full"
                un-h="5"
                un-mr="1"
                un-inline
                :src="store.getAvatarUrl(video.requestedBy)"
              />
              <span un-text="cyan-500">{{ store.getName(video.requestedBy) }}</span
              >さんのリクエスト
            </div>

            <div un-flex="~ row" un-gap="2" un-sm="hidden">
              <TooltipIcon
                v-if="store.isHost || video.requestedBy === store.me.id"
                un-self="center"
                un-cursor="pointer"
                un-h="full"
                un-aspect="square"
                un-grid
                un-place-items="center"
                name="md-delete"
                tooltip="削除"
                @click="deleteVideo(video)"
              />
              <TooltipIcon
                un-self="center"
                un-cursor="pointer"
                un-h="full"
                un-aspect="square"
                un-grid
                un-place-items="center"
                name="md-openinnew"
                tooltip="開く"
                @click="openExternal(`https://www.nicovideo.jp/watch/${video.id}`)"
              />
            </div>
          </div>

          <div un-flex="sm:row" un-hidden un-sm="flex" un-pr="2">
            <TooltipIcon
              v-if="store.isHost || video.requestedBy === store.me.id"
              un-self="center"
              un-cursor="pointer"
              un-h="3/4"
              un-aspect="square"
              un-grid
              un-place-items="center"
              un-p="3"
              name="md-delete"
              tooltip="削除"
              @click="deleteVideo(video)"
            />
            <TooltipIcon
              un-self="center"
              un-cursor="pointer"
              un-h="3/4"
              un-aspect="square"
              un-grid
              un-place-items="center"
              un-p="3"
              name="md-openinnew"
              tooltip="開く"
              @click="openExternal(`https://www.nicovideo.jp/watch/${video.id}`)"
            />
          </div>
        </div>
      </template>
    </Draggable>
  </div>
  <div un-absolute un-w="full" un-bottom="0">
    <div
      un-absolute
      un-w="full"
      un-p="2"
      un-h="16"
      un-bottom="8"
      un-left="0"
      un-bg="black"
      un-transition="opacity"
      un-pointer-events="none"
      un-grid
      un-place-content="center"
      :un-text="popupType === 'error' ? 'red-500' : popupType === 'info' ? 'green-500' : null"
      :style="{ opacity: popupCount > 0 ? 1 : 0 }"
    >
      {{ popup }}
    </div>
    <form class="queue-form" un-w="full" un-flex un-h="8" un-z="50" @submit.prevent="onSubmit">
      <div
        un-absolute
        un-inset="0"
        un-bg="slate-500/25"
        un-transition="opacity"
        un-z="50"
        :style="{
          pointerEvents: isSubmitting ? 'auto' : 'none',
          opacity: isSubmitting ? 1 : 0,
        }"
      />
      <input
        v-model="videoSource"
        :disabled="!store.canQueue"
        un-bg="white"
        un-p="2"
        un-text="slate-950"
        un-outline="none"
        un-flex-grow
        un-rounded="none"
        un-w="[calc(100%_-_4rem)] sm:auto"
        :un-cursor="store.canQueue ? null : 'not-allowed'"
        :un-opacity="store.canQueue ? null : '50'"
        :placeholder
      />
      <button
        :disabled="!store.canQueue"
        type="submit"
        un-h="full"
        un-bg="black"
        un-px="4"
        un-p="sm:1"
        un-w="16"
        un-rounded="none"
        :un-cursor="store.canQueue ? 'pointer' : 'not-allowed'"
        :un-opacity="store.canQueue ? null : '50'"
        :un-active="store.canQueue ? 'bg-cyan-500' : null"
      >
        {{ buttonState === "search" ? "検索" : buttonState === "submit" ? "追加" : "戻る" }}
      </button>
    </form>
  </div>
</template>
<style scoped lang="scss"></style>
