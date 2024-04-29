<script setup lang="ts">
import { computed } from "vue"
import { useStore } from "~/store"

const store = useStore()
const sha = import.meta.env.VITE_COMMIT
const formattedSession = computed(() => JSON.stringify(store.$state, null, 2))
</script>
<template>
  <div class="min-h-full w-full bg-black/50 p-2 overflow-y-auto">
    <div>
      ビルド：
      <span class="text-cyan-500 font-mono">{{ sha }} </span>
    </div>
    <div>
      <div>セッション：</div>
      <textarea
        class="font-mono w-full h-64 text-black text-xs"
        readonly
        :value="formattedSession"
      />
    </div>
  </div>
</template>
<style scoped lang="scss"></style>
