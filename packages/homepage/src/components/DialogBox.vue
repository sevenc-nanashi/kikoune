<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue"
import MarkdownRenderer from "./MarkdownRenderer.vue"

const open = ref(false)
const fadeOut = ref(false)
const dialog = ref<HTMLDialogElement>(null!)
const props = defineProps<{
  id: string
  title: string
  content: string
}>()

const watchHash = () => {
  open.value = location.hash === `#${props.id}`
}
const close = () => {
  location.hash = ""
}

watch(open, (open) => {
  if (open) {
    dialog.value.showModal()
  } else {
    fadeOut.value = true
    setTimeout(() => {
      fadeOut.value = false
      dialog.value.close()
    }, 300)
  }
})

onMounted(() => {
  watchHash()
  window.addEventListener("hashchange", watchHash)
})

onUnmounted(() => {
  window.removeEventListener("hashchange", watchHash)
})
</script>

<template>
  <dialog
    ref="dialog"
    class="dialog bg-gray-900 p-4 rounded-lg max-w-md max-h-[70vh] overflow-y-auto m-auto"
    :class="{ 'fade-out': fadeOut }"
    @click="close"
  >
    <div @click.stop>
      <h2
        class="text-3xl font-bold text-cyan-500 border-b-[1px] border-cyan-500 pb-2 mb-2 flex items-center"
      >
        {{ props.title }}
        <div class="flex-grow" />
        <a @click="close">×</a>
      </h2>
      <MarkdownRenderer :source="props.content" />
    </div>
  </dialog>
</template>

<style scoped lang="scss">
.dialog {
  transition:
    opacity 0.3s,
    transform 0.3s;

  &::backdrop {
    transition: opacity 0.3s;
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.5);
  }
  transform: none;
  &[open] {
    opacity: 1;
    @starting-style {
      transform: translateY(1rem);
      opacity: 0;

      &::backdrop {
        opacity: 0;
      }
    }

    &.fade-out {
      transform: translateY(1rem);
      opacity: 0;

      &::backdrop {
        opacity: 0;
      }
    }
  }
}
</style>
