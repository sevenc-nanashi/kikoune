<script setup lang="ts">
import { computed, ref } from "vue"
import { MemberState, defaultMemberState } from "@kikoune/shared"
import { useStore } from "~/store"

const props = defineProps<{
  id: string
  speaking: boolean
}>()
const store = useStore()
const name = computed(() => store.getName(props.id))
const memberState = computed<MemberState>(() => {
  if (props.id === store.me.id) {
    return { ...store.memberStates[props.id], ...store.stateOverride }
  }
  return { ...defaultMemberState, ...store.memberStates[props.id] }
})
const avatarUrl = computed(() => store.getAvatarUrl(props.id))
const showTooltip = ref(false)
</script>
<template>
  <div
    class="w-12 h-12 absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out cafe-user drop-shadow"
    :class="{
      'z-10': store.me.id !== props.id,
      'z-20': store.me.id === props.id,
    }"
    :style="{
      left: `${50 + (memberState.x || 0) * 50}%`,
      top: `${50 + (memberState.y || 0) * 50}%`,
    }"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <img
      :src="avatarUrl"
      class="absolute inset-0 rounded-full outline-cyan-500 outline-4 outline-offset-4"
      :class="{
        outline: speaking,
      }"
      :style="{
        animation:
          memberState.rotate || speaking ? 'spin 5s linear infinite' : 'none',
      }"
    />
    <p
      v-if="memberState.message"
      class="absolute top-[-0.5rem] -translate-y-full w-48 break-words left-1/2 -translate-x-1/2 text-center text-sm p-1 text-slate-950 rounded border-[1px] border-cyan-500 bg-cyan-100 drop-shadow-md transition-all"
    >
      {{ memberState.message }}
    </p>
    <p
      class="absolute bottom-[-1rem] left-0 right-0 text-center text-xs text-white drop-shadow"
      :class="{
        'opacity-0 pointer-events-none': !showTooltip,
        'opacity-100 pointer-events-auto': showTooltip,
      }"
    >
      {{ name }}
    </p>
  </div>
</template>
<style scoped lang="scss">
@media (min-height: 600px) {
  .cafe-user {
    @apply w-16 h-16;
  }
}
</style>
