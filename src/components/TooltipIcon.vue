<script setup lang="ts">
import { ref } from "vue"
const props = defineProps<{
  name: string
  tooltip: string
}>()
const showTooltip = ref(false)
</script>
<template>
  <button
    class="relative"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <div
      class="absolute w-max left-1/2 -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 pointer-events-none transition-all"
      :class="{
        'opacity-0 top-0': !showTooltip,
        'opacity-100 top-[-1rem]': showTooltip,
      }"
    >
      {{ props.tooltip }}
    </div>
    <v-icon :name="props.name" class="w-full h-full" />
  </button>
</template>
<style scoped lang="scss"></style>
