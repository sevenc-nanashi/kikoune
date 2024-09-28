<script setup lang="ts">
import consola from "consola"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"

const store = useStore()
const sha = import.meta.env.VITE_COMMIT

const discordSdk = useDiscordSdk()
const openExternal = (url: string) => {
  discordSdk.commands.openExternalLink({ url })
}
let debugCount = 0
const onTitleClick = () => {
  debugCount++
  if (debugCount >= 10) {
    consola.info("Debug mode enabled")
    store.setDebug(true)
  }
}
</script>
<template>
  <div class="min-h-full w-full bg-black/50 p-2">
    <h1
      class="font-bold text-xl"
      :class="{
        'text-cyan-500': store.debug,
      }"
      @click="onTitleClick"
    >
      Kikoune
    </h1>
    <p>Kikoune は、ニコニコ動画の動画を同時視聴できるアクティビティです。</p>
    <ul class="pt-2">
      <li>
        開発者：
        <a
          class="text-[#48b0d5] hover:underline cursor-pointer"
          @click="openExternal('https://sevenc7c.com')"
          >名無し。
        </a>
      </li>
      <li>
        ホームページ：
        <a
          class="text-cyan-500 hover:underline cursor-pointer"
          @click="openExternal('https://sevenc7c.com/kikoune')"
          >sevenc7c.com/kikoune
        </a>
      </li>
      <li>
        サポートサーバー：
        <a
          class="text-cyan-500 hover:underline cursor-pointer"
          @click="openExternal('https://discord.gg/CE3h4NNK2W')"
          >discord.gg/CE3h4NNK2W
        </a>
      </li>
      <li>
        ソースコード：
        <a
          class="text-cyan-500 hover:underline cursor-pointer"
          @click="openExternal('https://github.com/sevenc-nanashi/kikoune')"
          >sevenc-nanashi/kikoune
        </a>
      </li>
      <li>
        ビルド：
        <a
          class="text-cyan-500 hover:underline cursor-pointer font-mono"
          @click="
            openExternal(
              `https://github.com/sevenc-nanashi/kikoune/tree/${sha}`
            )
          "
          >{{ sha }}
        </a>
      </li>
    </ul>
  </div>
</template>
<style scoped lang="scss"></style>
