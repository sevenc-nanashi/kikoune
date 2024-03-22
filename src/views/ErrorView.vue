<script setup lang="ts"></script>
<template>
  <div
    class="w-screen h-screen relative place-items-center place-content-center grid bg-red-950"
  >
    <div class="absolute inset-0 cursor-wait" />
    <h1 class="text-5xl sm:text-9xl font-extrabold">Kikoune</h1>
    <hr class="border-b-[1px] border-white w-full my-2 xs:my-5" />
    <p class="text-md sm:text-2xl text-red-500">
      エラーが発生しました。アクティビティを退出し、再度参加してください。
    </p>
    <BuildInfo />
  </div>
</template>
<style lang="scss"></style>
