<script setup lang="ts">
import BuildInfo from "~/components/BuildInfo.vue"
</script>
<template>
  <div
    class="w-screen h-screen relative place-items-center place-content-center grid bg-red-950"
  >
    <LogoSvg class="h-12 sm:h-32" />
    <hr class="border-b-[1px] border-white w-full my-2 xs:my-5" />
    <p class="text-md sm:text-2xl text-red-500">
      エラーが発生しました。アクティビティを退出し、再度参加してください。
    </p>
    <BuildInfo />
  </div>
</template>
<style lang="scss"></style>
