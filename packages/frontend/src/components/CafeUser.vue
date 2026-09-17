<script setup lang="ts">
import { MemberState, defaultMemberState } from "@kikoune/shared";
import { computed, ref } from "vue";

import { useStore } from "~/store";

const props = defineProps<{
  id: string;
  speaking: boolean;
}>();
const store = useStore();
const name = computed(() => store.getName(props.id));
const memberState = computed<MemberState>(() => {
  if (props.id === store.me.id) {
    return { ...store.memberStates[props.id], ...store.stateOverride };
  }
  return { ...defaultMemberState, ...store.memberStates[props.id] };
});
const avatarUrl = computed(() => store.getAvatarUrl(props.id));
const showTooltip = ref(false);
</script>
<template>
  <div
    class="cafe-user"
    un-absolute
    un-translate-x="-1/2"
    un-translate-y="-1/2"
    un-transition="all"
    un-duration="300"
    un-ease="out"
    un-pointer-events="none"
    :un-z="store.me.id === props.id ? '40' : '30'"
    :style="{
      left: `${50 + (memberState.x || 0) * 50}%`,
      top: `${50 + (memberState.y || 0) * 50}%`,
    }"
  >
    <Transition name="fade">
      <p
        v-if="memberState.message && memberState.message.trim()"
        un-absolute
        un-top="[-0.5rem]"
        un-translate-y="-full"
        un-w="48"
        un-break="words"
        un-left="1/2"
        un-translate-x="-1/2"
        un-text="sm center slate-950"
        un-p="1"
        un-rounded
        un-border="[1px] cyan-500"
        un-bg="cyan-100"
        un-drop-shadow="md"
        un-transition="all"
      >
        {{ memberState.message }}
      </p>
    </Transition>
  </div>
  <div
    class="cafe-user"
    un-absolute
    un-translate-x="-1/2"
    un-translate-y="-1/2"
    un-transition="all"
    un-duration="300"
    un-ease="out"
    un-drop-shadow
    :un-z="store.me.id === props.id ? '20' : '10'"
    :style="{
      left: `${50 + (memberState.x || 0) * 50}%`,
      top: `${50 + (memberState.y || 0) * 50}%`,
    }"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <img
      :src="avatarUrl"
      un-absolute
      un-inset="0"
      un-rounded="full"
      :un-outline="speaking ? '4 cyan-500' : null"
      :un-outline-offset="speaking ? '4' : null"
      :style="{
        animation: memberState.rotate || speaking ? 'spin 5s linear infinite' : 'none',
      }"
    />
    <p
      un-absolute
      un-top="16"
      un-left="0"
      un-right="0"
      un-text="center xs white"
      un-drop-shadow
      un-break="words"
      un-pointer-events="none"
      :un-opacity="showTooltip ? '100' : '0'"
    >
      {{ name }}
    </p>
  </div>
</template>
<style scoped lang="scss">
.cafe-user {
  @apply w-12 h-12 sm:w-16 sm:h-16;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
