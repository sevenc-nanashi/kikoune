<script setup lang="ts">
import {
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from "radix-vue"

defineOptions({
  inheritAttrs: false,
})

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
</script>
<template>
  <TooltipRoot>
    <TooltipTrigger>
      <button class="relative" v-bind="$attrs">
        <v-icon
          :name="props.name"
          class="w-full h-full"
          :class="{ 'opacity-50': props.disabled }"
        />
      </button>
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        class="w-max bg-black/75 text-white text-xs px-3 py-1 pointer-events-none transition-all"
        :side="props.direction"
      >
        {{ props.tooltip }}
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
<style scoped lang="scss"></style>
