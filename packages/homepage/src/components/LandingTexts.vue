<script setup lang="ts">
import LogoSvg from "@kikoune/shared/assets/logo_wide.svg?component"
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
    <LogoSvg class="max-sm:w-[90vw] h-auto sm:h-32" />
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
    <p class="text-md sm:text-xl w-full px-4 text-center">
      <budoux-ja
        >DiscordのActivityで動く、Kiite&nbsp;Cafe風にニコニコ動画を同時再生するアプリ。</budoux-ja
      >
    </p>
    <a
      class="text-cyan-500 border-1 border-cyan-500 p-2 px-4 my-2 rounded-full"
      href="#install"
      >インストール</a
    >
    <nav
      class="text-center absolute left-1/2 -translate-x-1/2 bottom-4 flex navigation max-sm:flex-col gap-1 sm:gap-4"
    >
      <a href="#terms">利用規約</a><span class="navigation-border" /><a
        href="#privacy"
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
  @media (min-width: 640px) {
    border-right: 1px solid white;
  }
  @media not all and (min-width: 640px) {
    border-bottom: 1px solid #fff4;
    width: 75vw;
  }
}
</style>
