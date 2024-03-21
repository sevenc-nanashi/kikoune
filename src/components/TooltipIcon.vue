<script setup lang="ts">
import { ref } from "vue"
const props = withDefaults(
  defineProps<{
    name: string
    tooltip: string
    disabled?: boolean
    offset?: string
    direction?: "top" | "bottom"
  }>(),
  {
    disabled: false,
    offset: "0px",
    direction: "top",
  }
)
const showTooltip = ref(false)
</script>
<template>
  <button
    class="relative"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <div
      class="absolute w-max left-1/2 bg-black/75 text-white text-xs px-3 py-1 pointer-events-none transition-all"
      :class="{
        'opacity-0': !showTooltip,
        'opacity-100': showTooltip,
      }"
      :style="{
        transform: `translate(calc(-50% + ${props.offset || '0px'}), ${props.direction === 'top' ? '-' : '+'}100%)`,
      }"
    >
      {{ props.tooltip }}
    </div>
    <v-icon
      :name="props.name"
      class="w-full h-full"
      :class="{ 'opacity-50': props.disabled }"
    />
  </button>
</template>
<style scoped lang="scss"></style>
