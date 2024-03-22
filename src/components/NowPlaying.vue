<script setup lang="ts">
import consola from "consola"
import { ref, watch } from "vue"
import TooltipIcon from "./TooltipIcon.vue"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"

const store = useStore()
const discordSdk = useDiscordSdk()

const skipped = ref(false)
watch(
  () => store.session.video?.nonce,
  () => {
    skipped.value = false
  }
)

const openVideo = () => {
  if (store.session.video) {
    discordSdk.commands.openExternalLink({
      url: `https://www.nicovideo.jp/watch/${store.session.video.id}`,
    })
  }
}
const skipVideo = async () => {
  skipped.value = true
  const resp = await fetch(`/api/room/${discordSdk.instanceId}/skip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${store.me.id} ${store.token}`,
    },
    body: JSON.stringify({
      nonce: store.session.video?.nonce,
    }),
  })
  if (!resp.ok) {
    consola.error("Failed to skip video")
    skipped.value = false
  }
}
const openProfile = () => {
  discordSdk.commands.openExternalLink({
    url: "https://sevenc7c.com",
  })
}
</script>
<template>
  <div class="*:bg-black/75 gap-2 flex-row">
    <div
      class="h-full aspect-square bg-slate-500 relative rounded overflow-hidden hidden sm:block"
    >
      <div
        class="absolute inset-[-16%] bg-cover bg-center"
        :style="{
          backgroundImage: `url('${store.thumbnailUrl}')`,
        }"
      />
    </div>
    <div
      class="h-full p-2 flex-grow flex flex-col sm:flex-row items-start sm:items-center info-container"
    >
      <div class="my-auto flex-grow text-section">
        <h2 class="text-xl font-bold">
          {{ store.session.video?.title ?? "Kikoune" }}
        </h2>
        <p class="text-md">
          <template v-if="store.session.video">
            {{ store.session.video?.author }}
          </template>
          <template v-else>
            Developed by
            <span
              class="text-[#48b0d5] cursor-pointer hover:underline"
              @click="openProfile"
              >Nanashi.</span
            >
          </template>
        </p>
      </div>
      <div
        v-if="store.session.video"
        class="w-full sm:w-auto xs:max-sm:pt-2 flex flex-row items-center"
      >
        <TooltipIcon
          name="md-openinnew"
          tooltip="ブラウザで開く"
          offset="2rem"
          class="w-6 h-6 mr-2 hidden xs:max-sm:block"
          @click="openVideo"
        />
        <TooltipIcon
          v-if="store.isHost || store.session.video.requestedBy === store.me.id"
          name="md-fastforward"
          tooltip="スキップ"
          :disabled="skipped"
          class="w-6 h-6 mr-2"
          @click="skipVideo"
        />
        <div class="flex-grow sm:hidden" />
        <span class="text-sm requester-name">
          {{ store.getName(store.session.video?.requestedBy) }}
        </span>
        <img
          class="rounded-full w-6 h-6"
          :src="store.getAvatarUrl(store.session.video.requestedBy)"
        />
      </div>
    </div>
    <a
      class="h-full aspect-square place-items-center transition-colors hidden sm:grid"
      :class="{
        'hover:bg-black cursor-pointer': store.session.video,
        'cursor-not-allowed': !store.session.video,
      }"
      @click="openVideo"
    >
      <v-icon
        name="md-openinnew"
        class="w-1/2 h-1/2"
        :disabled="!store.session.video"
      />
    </a>
  </div>
</template>
<style scoped lang="scss">
@media (max-height: 480px) {
  .requester-name {
    display: none;
  }
  .text-section {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;

    margin-top: 0;
    margin-bottom: 0;
  }
  .info-container {
    padding: 0 0.5rem;
  }
}
</style>
