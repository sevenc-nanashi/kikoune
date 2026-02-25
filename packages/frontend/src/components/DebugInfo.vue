<script setup lang="ts">
import { computed } from "vue";
import { useConsolaMessages } from "~/plugins/useConsolaMessages";
import { useStore } from "~/store";

const store = useStore();
const log = useConsolaMessages();
const sha = import.meta.env.VITE_COMMIT;
const formattedSession = computed(() => JSON.stringify(store.$state, null, 2));

const logLevels = ["error", "warn", "log", "info", "debug"];
</script>
<template>
  <div un-min-h="full" un-w="full" un-p="2" un-overflow-y="auto">
    <div>
      ビルド：
      <span un-text="cyan-500" un-font="mono">{{ sha }} </span>
    </div>
    <div>
      <div>セッション：</div>
      <textarea
        un-font="mono"
        un-w="full"
        un-h="64"
        un-text="black xs"
        un-p="2"
        un-bg="white"
        readonly
        :value="formattedSession"
      />
    </div>
    <div>
      <div>ログ：</div>
      <div un-text="xs" un-font="mono" un-h="64" un-overflow-y="auto" un-overflow-x="scroll">
        <div v-for="message in log.toReversed()" :key="message.date.toString()" un-gap="2">
          <span>{{ message.date.toISOString() }}</span>
          <span
            :un-bg="['red-500', 'yellow-500', 'green-500', 'blue-500', 'gray-500'][message.level]"
            un-rounded
            un-px="1"
            un-ml="1"
            un-text="white xs"
          >
            {{ logLevels[message.level] }}
          </span>
          <span
            v-if="message.tag"
            :un-text="['red-500', 'yellow-500', 'green-500', 'blue-500', 'gray-500'][message.level]"
            un-ml="1"
            >{{ message.tag }}</span
          >
          <span un-ml="1">{{ (message.args || []).map((obj) => obj.toString()).join(" ") }}</span>
        </div>
      </div>
    </div>
    <div>
      <div>Panic：</div>
      <div>
        <button un-bg="red-500" un-text="white" un-p="2" un-rounded @click="store.panic()">
          Panic
        </button>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss"></style>
