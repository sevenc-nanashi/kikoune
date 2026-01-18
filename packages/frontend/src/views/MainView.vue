<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import consola from "consola/browser";
import { MemberState, Session, defaultMemberState } from "@kikoune/shared";
import NicoPlayer from "~/components/NicoPlayer.vue";
import InfoPanel from "~/components/InfoPanel.vue";
import NowPlaying from "~/components/NowPlaying.vue";
import CafeController from "~/components/CafeController.vue";
import CafeSpace from "~/components/CafeSpace.vue";
import MobileView from "~/components/MobileView.vue";
import { useDiscordSdk } from "~/plugins/useDiscordSdk.ts";
import { sessionNotStarted, useStore } from "~/store.ts";

const discordSdk = useDiscordSdk();
const store = useStore();
const log = consola.withTag("MainView");

const errorCount = ref(0);

const update = async () => {
  const res = await fetch(`/api/room/${discordSdk.instanceId}/sync`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${store.me.id} ${store.token}`,
    },
    body: JSON.stringify({
      userIds: store.participants.map((user) => user.id),
      state: {
        ...defaultMemberState,
        ...store.memberStates[store.me.id],
        ...store.stateOverride,
      },
    }),
  });
  if (!res.ok) {
    log.error(`Failed to sync (${res.status}), panic in ${3 - errorCount.value}`);
    errorCount.value++;
    if (errorCount.value > 3) {
      store.panic();
    }
    return;
  }
  log.info("Synced");
  errorCount.value = 0;
  const data: {
    memberStates: Record<string, MemberState>;
    session: Session;
  } = await res.json();
  store.setSession(data.session);
  store.setMemberStates(data.memberStates);
  store.resetIsHostOverride();
  store.resetSettingOverride();
  if (Date.now() - store.stateOverrideUpdatedAt > 500) {
    store.resetStateOverride();
  }
};

const currentId = computed(() => store.session.video?.id ?? "");
let interval: ReturnType<typeof setInterval>;
let initialTimeout: ReturnType<typeof setTimeout>;
onMounted(() => {
  initialTimeout = setTimeout(
    () => {
      update();
      interval = setInterval(update, 5000);
    },
    5000 ^ (Date.now() % 5000),
  );
});
onUnmounted(() => {
  clearInterval(interval);
  clearTimeout(initialTimeout);
});

const state = computed(() => {
  if (store.session.video) return "play";
  if (store.session.startedAt === sessionNotStarted) return "sync";
  return "idle";
});

watch(
  () => store.session.video,
  async () => {
    discordSdk.commands.setActivity({
      activity: store.session.video
        ? {
            state: `\u{1f464} ${Object.values(store.memberStates).length} | 回 ${
              Object.values(store.memberStates).filter((s) => s.rotate).length
            }`,
            details: `\u266a ${store.session.video.title}`,
            assets: {
              large_image: store.session.video.thumbnailUrl,
              large_text: `${store.session.video.title} - ${store.session.video.author}`,
            },
            timestamps: {
              start: store.session.startedAt,
            },
          }
        : {
            state: "選曲中...",
          },
    });
  },
  { immediate: true },
);
</script>
<template>
  <div
    un-bg="white/25"
    un-absolute
    un-inset="0"
    un-place-items="center"
    un-place-content="center"
    un-grid
    un-transition="opacity"
    un-z="20"
    :style="{
      opacity: errorCount > 1 ? 1 : 0,
      pointerEvents: errorCount > 1 ? 'auto' : 'none',
    }"
  />
  <div class="root" un-xs="relative">
    <div class="top-section" un-xs="relative" un-flex="~" un-h="full" un-justify="center sm:normal">
      <NicoPlayer class="nico-player" un-w="max-sm:full sm:auto" un-h="xs:full" un-aspect="video" />
      <InfoPanel class="hidden-on-miniplayer" un-hidden un-sm="flex" un-h="full" />
    </div>
    <NowPlaying class="hidden-on-miniplayer" un-hidden un-xs="flex" un-h="full" />
    <CafeSpace class="hidden-on-miniplayer" un-hidden un-xs="block" />
    <CafeController class="hidden-on-miniplayer" un-hidden un-xs="flex" un-z="10" />
    <MobileView class="mobile-view hidden-on-miniplayer" un-hidden un-xs:max-sm="block" un-z="10" />
  </div>
  <div class="background-container" un-hidden un-xs="block">
    <div
      class="background"
      :style="{ backgroundImage: currentId && `url(${store.thumbnailUrl})` }"
      :un-bg="state === 'idle' ? 'slate-500' : state === 'sync' ? 'slate-900' : null"
    />
  </div>
</template>
<style scoped lang="scss">
$padding: 8px;

.root {
  padding-top: calc(var(--sait) + $padding);
  padding-left: calc(var(--sail) + $padding);
  padding-right: calc(var(--sair) + $padding);
  padding-bottom: calc(var(--saib) + $padding);
  gap: $padding;

  width: calc(100vw / var(--zoom-scale));
  height: calc(100vh / var(--zoom-scale));
  transform-origin: top left;
  transform: scale(var(--zoom-scale));

  display: grid;
  grid-template-rows: calc(45% - 4.5rem) 4.5rem 1fr auto;

  // ミニプレイヤー
  @media (max-width: 375px) {
    padding: 0;

    width: 100vw;
    height: 100vh;
    transform: none;
  }

  // スマホ
  @media (max-width: 640px) {
    grid-template-rows: auto auto 1fr auto;
  }

  // PC
  @media (max-height: 480px) and (min-width: 640px) {
    grid-template-rows: calc(45vh - 2rem) 2rem 1fr auto;
  }
}

.top-section {
  gap: $padding;
}

.background-container {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.background {
  position: absolute;
  inset: -3rem;
  transition: background 300ms;
  background-size: cover;
  background-position: center;
  filter: blur(25px) brightness(0.8);
}

// ミニプレイヤー
@media (max-height: 240px) {
  .nico-player {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
  }
}
</style>
