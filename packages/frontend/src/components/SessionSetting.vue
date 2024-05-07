<script setup lang="ts">
import consola from "consola/browser"
import { computed, ref } from "vue"
import { SessionSetting } from "@kikoune/shared"
import { useStore } from "~/store"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { debounce } from "~/lib/utils"

const store = useStore()
const discordSdk = useDiscordSdk()
const log = consola.withTag("RoomSetting")

const setting = computed(() => store.sessionSetting)
const updateSetting = async <K extends keyof SessionSetting>(
  key: K,
  value: SessionSetting[K]
) => {
  store.setSettingOverride({ [key]: value })
  log.info(`Sending ${key}: ${JSON.stringify(value)}`)
  const res = await fetch(`/api/room/${discordSdk.instanceId}/setting`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${store.me.id} ${store.token}`,
    },
    body: JSON.stringify({
      [key]: value,
    }),
  })
  log.info(`Result: ${res.status}`)
}

const queueLocked = computed({
  get: () => setting.value.queueLocked,
  set: (value) => updateSetting("queueLocked", value),
})
const random = computed({
  get: () => setting.value.random,
  set: (value) => updateSetting("random", value),
})
const queueHidden = computed({
  get: () => setting.value.queueHidden,
  set: (value) => updateSetting("queueHidden", value),
})
const queueLimitOverride = ref<number | undefined>(undefined)
const updateQueueLimit = debounce(500, (value: number) => {
  updateSetting("queueLimit", value).finally(() => {
    queueLimitOverride.value = undefined
  })
})
const queueLimit = computed({
  get: () => queueLimitOverride.value ?? setting.value.queueLimit,
  set: (value) => {
    queueLimitOverride.value = value < 1 ? 1 : value
    updateQueueLimit(queueLimitOverride.value)
  },
})
</script>
<template>
  <div class="bg-black/25 h-full w-full relative flex flex-col">
    <div
      class="flex-grow flex flex-col relative gap-1 h-screen pt-1 xs:max-sm:pb-20 pb-1 sm:h-auto overflow-y-scroll"
    >
      <p class="pl-2">ホストは殆どの設定を無視することができます。</p>
      <div class="px-2 config-item">
        <label
          >キューの追加を制限する <input v-model="queueLocked" type="checkbox"
        /></label>
        <p>キューの追加をホストのみに制限します。</p>
      </div>
      <div class="px-2 config-item">
        <label
          >キューを非表示にする <input v-model="queueHidden" type="checkbox"
        /></label>
        <p>キューを非表示にします。キューの追加を制限することを推奨します。</p>
      </div>
      <div class="px-2 config-item">
        <label
          >キューの最大曲数
          <input v-model="queueLimit" type="number" class="text-black" min="1"
        /></label>
        <p>キューに追加できる最大曲数を制限します。</p>
      </div>
      <div class="px-2 config-item">
        <label>ランダム再生 <input v-model="random" type="checkbox" /></label>
        <p>キューをランダムな順序で再生します。</p>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.config-item {
  @apply bg-black/50 p-2;
  label {
    @apply cursor-pointer;
  }
  input {
    @apply ml-2;
    @apply cursor-pointer;
  }
  p {
    @apply text-xs mt-1;
  }
}
</style>
