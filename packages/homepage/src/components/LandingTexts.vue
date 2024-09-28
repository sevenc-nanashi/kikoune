<script setup lang="ts">
import LogoSvg from "~/assets/title.svg?component"
import DialogBox from "~/components/DialogBox.vue"
import install from "~/contents/install.md?raw"
import terms from "~/contents/terms.md?raw"
import privacy from "~/contents/privacy.md?raw"
</script>

<template>
  <section
    class="grid place-items-center place-content-center w-screen h-screen"
  >
    <DialogBox id="install" title="使い方" :content="install" />
    <DialogBox id="terms" title="利用規約" :content="terms" />
    <DialogBox id="privacy" title="プライバシーポリシー" :content="privacy" />
    <LogoSvg class="h-12 sm:h-32" />
    <p class="text-xl sm:text-2xl">
      Developed by
      <a
        class="text-[#48b0d5] hover:underline"
        href="https://sevenc7c.com"
        target="_blank"
        >Nanashi.</a
      >
    </p>
    <hr class="border-b-[1px] border-white w-full my-2 xs:my-5" />
    <p class="text-xl">
      DiscordのActivityで動く、Kiite Cafe風にニコニコ動画を同時再生するアプリ。
    </p>
    <nav class="absolute bottom-4 gap-4 flex navigation">
      <a class="text-cyan-500" href="#install">インストール</a
      ><span class="navigation-border" /><a href="#terms">利用規約</a
      ><span class="navigation-border" /><a href="#privacy"
        >プライバシーポリシー</a
      ><span class="navigation-border" /><a
        href="https://github.com/sevenc-nanashi/kikoune"
        target="_blank"
        rel="noopener noreferrer"
        >ソースコード</a
      ><span class="navigation-border" /><a
        href="https://discord.gg/CE3h4NNK2W"
        target="_blank"
        rel="noopener noreferrer"
        >サポートサーバー</a
      >
    </nav>
  </section>
</template>

<style scoped lang="scss">
.navigation-border {
  border-right: 1px solid white;
}
</style>
