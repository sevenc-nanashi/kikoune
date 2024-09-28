<script setup lang="ts">
import { useHead } from "@unhead/vue"
import LandingTexts from "./components/LandingTexts.vue"
import demo from "./assets/demo.png"

useHead({
  meta: [
    {
      name: "theme-color",
      content: "#06b6d4",
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:title",
      content: "Kikoune",
    },
    {
      property: "og:description",
      content:
        "DiscordのActivityで動く、Kiite Cafe風にニコニコ動画を同時再生するアプリ。",
    },
    {
      property: "twitter:card",
      content: "summary_large_image",
    },
    {
      property: "twitter:title",
      content: "Kikoune",
    },
    {
      property: "twitter:description",
      content:
        "DiscordのActivityで動く、Kiite Cafe風にニコニコ動画を同時再生するアプリ。",
    },
  ],
})
</script>

<template>
  <main class="relative"><LandingTexts /></main>
  <img :src="demo" class="demo-background" />
</template>

<style scoped lang="scss">
main {
  z-index: 1;
}
.demo-background {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.1;

  pointer-events: none;
}
</style>
