<script setup lang="ts">
import BuildInfo from "~/components/BuildInfo.vue";
import LogoSvg from "~/assets/title.svg?component";
</script>
<template>
  <div un-w="screen" un-h="screen" un-relative un-place-items="center" un-place-content="center" un-grid
    un-bg="red-950">
    <LogoSvg un-h="12 sm:32" />
    <hr un-border-b="[1px]" un-border="white" un-w="full" un-my="2 xs:5" />
    <p un-text="sm red-500 center wrap" un-break="words" un-max-w="screen" un-px="4">
      エラーが発生しました。<br />アクティビティを退出し、再度参加してください。
    </p>
    <BuildInfo />
  </div>
</template>
<style lang="scss"></style>
