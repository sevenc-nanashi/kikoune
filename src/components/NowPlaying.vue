<script setup lang="ts">
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"

const store = useStore()
const discordSdk = useDiscordSdk()

const openVideo = () => {
  if (store.session.video) {
    discordSdk.commands.openExternalLink({
      url: `https://www.nicovideo.jp/watch/${store.session.video.id}`,
    })
  }
}
</script>
<template>
  <div class="*:bg-black/25 gap-2 flex-row">
    <div class="h-full p-2 flex-grow">
      <h2 class="text-xl font-bold mt-auto">
        {{ store.session.video?.title }}
      </h2>
      <p class="text-md mb-auto">{{ store.session.video?.author }}</p>
    </div>
    <a
      class="h-full aspect-square grid place-items-center transition-colors"
      :class="{
        'hover:bg-black cursor-pointer': store.session.video,
        'cursor-not-allowed': !store.session.video,
      }"
      @click="openVideo"
    >
      <v-icon
        name="md-openinnew"
        class="w-1/2 h-1/2"
        :class="{
          'opacity-50': !store.session.video,
        }"
      />
    </a>
  </div>
</template>
<style scoped lang="scss"></style>
