<script setup lang="ts">
import { computed } from "vue"
import { useConsolaMessages } from "~/plugins/useConsolaMessages"
import { useStore } from "~/store"

const store = useStore()
const log = useConsolaMessages()
const sha = import.meta.env.VITE_COMMIT
const formattedSession = computed(() => JSON.stringify(store.$state, null, 2))

const logLevels = ["error", "warn", "log", "info", "debug"]
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
    <div>
      <div>ログ：</div>
      <div class="text-xs font-mono h-64 overflow-y-auto overflow-x-scroll">
        <div
          v-for="message in log.toReversed()"
          :key="message.date.toString()"
          class="flex items-center gap-2"
        >
          <span>{{ message.date.toISOString() }}</span>
          <span
            :class="{
              'bg-red-500': message.level === 0,
              'bg-yellow-500': message.level === 1,
              'bg-green-500': message.level === 2,
              'bg-blue-500': message.level === 3,
              'bg-gray-500': message.level === 4,
            }"
            class="rounded px-1 text-white text-xs"
          >
            {{ logLevels[message.level] }}
          </span>
          <span
            v-if="message.tag"
            :class="{
              'text-red-500': message.level === 0,
              'text-yellow-500': message.level === 1,
              'text-green-500': message.level === 2,
              'text-blue-500': message.level === 3,
              'text-gray-500': message.level === 4,
            }"
            >{{ message.tag }}</span
          >
          <span>{{
            (message.args || []).map((obj) => obj.toString()).join(" ")
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss"></style>
