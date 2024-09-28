<script setup lang="ts">
import { useHead } from "@unhead/vue"
import LandingTexts from "./components/LandingTexts.vue"

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
</template>

<style scoped lang="scss"></style>
