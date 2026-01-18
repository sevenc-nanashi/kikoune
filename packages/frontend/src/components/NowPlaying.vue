<script setup lang="ts">
import consola from "consola/browser";
import { computed, ref, watch } from "vue";
import TooltipIcon from "./TooltipIcon.vue";
import { useDiscordSdk } from "~/plugins/useDiscordSdk";
import { useStore } from "~/store";

const store = useStore();
const discordSdk = useDiscordSdk();
const log = consola.withTag("NowPlaying");

const skipped = ref(false);
watch(
  () => store.session.video?.nonce,
  () => {
    skipped.value = false;
  },
);

const openVideo = () => {
  if (store.session.video) {
    discordSdk.commands.openExternalLink({
      url: `https://www.nicovideo.jp/watch/${store.session.video.id}`,
    });
  } else {
    discordSdk.commands.openExternalLink({
      url: "https://sevenc7c.com/kikoune",
    });
  }
};
const skipVideo = async () => {
  skipped.value = true;
  const resp = await fetch(`/api/room/${discordSdk.instanceId}/skip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${store.me.id} ${store.token}`,
    },
    body: JSON.stringify({
      nonce: store.session.video?.nonce,
    }),
  });
  if (!resp.ok) {
    log.error("Failed to skip video");
    skipped.value = false;
  }
};
const openProfile = () => {
  discordSdk.commands.openExternalLink({
    url: "https://sevenc7c.com",
  });
};
const title = computed(() => store.session.video?.title ?? "Kikoune");
</script>
<template>
  <div class="*:bg-black/75" un-gap="2" un-flex="~ row">
    <div
      un-h="full"
      un-aspect="square"
      un-bg="slate-500"
      un-relative
      un-rounded
      un-overflow="hidden"
      un-hidden
      un-sm="block"
    >
      <div
        un-absolute
        un-inset="[-16%]"
        un-bg="cover center"
        :style="{
          backgroundImage: `url('${store.thumbnailUrl}')`,
        }"
      />
    </div>
    <div
      class="info-container"
      un-h="full"
      un-p="2"
      un-flex-grow
      un-flex="~ col sm:row"
      un-items="start sm:center"
    >
      <div class="text-section" un-my="auto" un-flex-grow>
        <h2 un-text="xl" un-font="bold">
          {{ title }}
        </h2>
        <p un-text="md">
          <template v-if="store.session.video">
            {{ store.session.video.author }}
          </template>
          <template v-else>
            Developed by
            <span un-text="[#48b0d5]" un-cursor="pointer" un-hover="underline" @click="openProfile"
              >Nanashi.</span
            >
          </template>
        </p>
      </div>
      <div
        v-if="store.session.video"
        un-w="full sm:auto"
        un-pt="xs:max-sm:2"
        un-flex="~ row"
        un-items="center"
      >
        <TooltipIcon
          name="md-openinnew"
          tooltip="ブラウザで開く"
          offset="2rem"
          un-w="6"
          un-h="6"
          un-mr="2"
          un-hidden
          un-xs:max-sm="block"
          @click="openVideo"
        />
        <TooltipIcon
          v-if="store.isHost || store.session.video.requestedBy === store.me.id"
          name="md-fastforward"
          tooltip="スキップ"
          :disabled="skipped"
          un-w="6"
          un-h="6"
          un-mr="2"
          @click="skipVideo"
        />
        <div un-flex-grow un-sm="hidden" />
        <span class="requester-name" un-text="sm">
          {{ store.getName(store.session.video.requestedBy) }}
        </span>
        <img
          un-rounded="full"
          un-ml="1"
          un-w="6"
          un-h="6"
          :src="store.getAvatarUrl(store.session.video.requestedBy)"
        />
      </div>
    </div>
    <a
      un-h="full"
      un-aspect="square"
      un-place-items="center"
      un-transition="colors"
      un-hidden
      un-sm="grid"
      un-hover="bg-black"
      un-cursor="pointer"
      @click="openVideo"
    >
      <v-icon name="md-openinnew" un-w="1/2" un-h="1/2" :disabled="!store.session.video" />
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
