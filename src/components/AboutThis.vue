<script setup lang="ts">
import { useDiscordSdk } from "~/plugins/useDiscordSdk"

const sha = import.meta.env.VITE_COMMIT

const discordSdk = useDiscordSdk()
const openExternal = (url: string) => {
  discordSdk.commands.openExternalLink({ url })
}
</script>
<template>
  <div class="min-h-full w-full bg-black/50 p-2">
    <h1 class="font-bold text-xl">Kikoune</h1>
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
          class="text-cyan-500 hover:underline cursor-pointer"
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
