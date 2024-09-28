<script setup lang="ts">
import { useHead } from "@unhead/vue"
import LandingTexts from "./components/LandingTexts.vue"

const demos = Object.values(
  import.meta.glob("./assets/demo/*.png", {
    eager: true,
  }) as Record<string, { default: string }>
).map((v) => v.default)
const demo = demos[Math.floor(Math.random() * demos.length)]

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
        "Discordのアクティビティで動く、Kiite Cafe風にニコニコ動画を同時再生するアプリ。",
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
        "Discordのアクティビティで動く、Kiite Cafe風にニコニコ動画を同時再生するアプリ。",
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
