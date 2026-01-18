<script setup lang="ts">
import { TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from "radix-vue";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    name: string;
    tooltip: string;
    disabled?: boolean;
    offset?: string;
    direction?: "top" | "bottom";
  }>(),
  {
    disabled: false,
    offset: "0px",
    direction: "top",
  },
);
</script>
<template>
  <TooltipRoot>
    <TooltipTrigger>
      <button un-relative v-bind="$attrs">
        <v-icon
          :name="props.name"
          un-w="full"
          un-h="full"
          :un-opacity="props.disabled ? '50' : ''"
        />
      </button>
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        un-w="max"
        un-bg="black/75"
        un-text="white xs"
        un-px="3"
        un-py="1"
        un-pointer-events="none"
        un-transition="all"
        :side="props.direction"
      >
        {{ props.tooltip }}
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
<style scoped lang="scss"></style>
