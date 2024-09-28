<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue"
import MarkdownRenderer from "./MarkdownRenderer.vue"

const open = ref(false)
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

onMounted(() => {
  watchHash()
  window.addEventListener("hashchange", watchHash)
})

onUnmounted(() => {
  window.removeEventListener("hashchange", watchHash)
})
</script>

<template>
  <Teleport to="#app">
    <Transition name="dialog" mode="out-in">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        @click="close"
      >
        <div
          class="dialog-content bg-gray-900 p-4 rounded-lg w-full max-w-md max-h-[70vh] overflow-y-auto"
          @click.stop
        >
          <h2
            class="text-3xl font-bold text-cyan-500 border-b-[1px] border-cyan-500 pb-2 mb-2 flex items-center"
          >
            {{ props.title }}
            <div class="flex-grow" />
            <a @click="close">×</a>
          </h2>
          <MarkdownRenderer :source="props.content" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s;

  .dialog-content {
    transition: transform 0.3s;
  }
}

.dialog-enter-from,
.dialog-leave-to {
  .dialog-content {
    transform: translateY(1rem);
  }

  opacity: 0;
}
</style>
