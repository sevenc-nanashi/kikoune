<script setup lang="ts">
import consola from "consola"
import { computed, ref, watch } from "vue"
import { Participant, useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"
import TooltipIcon from "~/components/TooltipIcon.vue"

const store = useStore()
const discordSdk = useDiscordSdk()

const isSubmitting = ref(false)
const popup = ref<string | undefined>()
const popupType = ref<"error" | "info">("error")
const popupCount = ref(0)
const spawnPopup = (message: string, type: "error" | "info") => {
  popup.value = message
  popupType.value = type
  popupCount.value++
  setTimeout(() => {
    popupCount.value--
  }, 5000)
}
const moveHostConfirm = ref<string | undefined>(undefined)
const temporaryHost = ref<string | undefined>(undefined)
watch(
  () => store.session.host,
  () => {
    temporaryHost.value = store.session.host
  }
)

const moveHost = async (member: Participant) => {
  if (isSubmitting.value) return
  consola.info("Moving host", member.id)

  try {
    isSubmitting.value = true
    moveHostConfirm.value = undefined

    const res = await fetch(`/api/room/${discordSdk.instanceId}/host`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${store.me.id} ${store.token}`,
      },
      body: JSON.stringify({
        id: member.id,
      }),
    })
    if (!res.ok) {
      consola.error("Failed to delete video")
      spawnPopup(`ホストを移動できませんでした。`, "error")
      return
    }

    spawnPopup(`ホストを移動しました。`, "info")
    store.setIsHostOverride(false)
    temporaryHost.value = member.id
  } finally {
    isSubmitting.value = false
  }
}

const host = computed(() => {
  return (
    store.participants.find((user) => user.id === temporaryHost.value) ??
    store.participants.find((user) => user.id === store.session.host)
  )
})

const otherMembers = computed(() =>
  store.participants.filter(
    (user) => user.id !== store.me.id && user.id !== host.value?.id
  )
)
const orderedMembers = computed(() => {
  if (host.value?.id === store.me.id || !host.value) {
    return [store.me, ...otherMembers.value]
  }
  return [host.value, store.me, ...otherMembers.value]
})
</script>
<template>
  <div
    class="bg-black/25 h-screen sm:h-auto min-h-full w-full relative flex flex-col gap-1 overflow-y-scroll sm:overflow-y-auto pb-8 sm:pb-0"
  >
    <div
      v-for="member in orderedMembers"
      :key="member.id"
      class="bg-black/50 p-2 flex gap-2 relative items-center"
    >
      <img
        class="rounded-full h-8 mr-1 inline"
        :src="store.getAvatarUrl(member.id)"
      />
      <div class="text-md">{{ store.getName(member.id) }}</div>
      <TooltipIcon
        v-if="host && host.id === member.id"
        name="md-star"
        tooltip="ホスト"
        direction="bottom"
      />
      <div class="flex-grow" />

      <TooltipIcon
        v-if="host && moveHostConfirm === member.id"
        :disabled="isSubmitting"
        name="md-check"
        tooltip="確認"
        @click="moveHost(member)"
      />
      <TooltipIcon
        v-if="host && moveHostConfirm === member.id"
        :disabled="isSubmitting"
        name="md-close"
        offset="-2rem"
        tooltip="キャンセル"
        @click="moveHostConfirm = undefined"
      />
      <TooltipIcon
        v-if="
          host &&
          moveHostConfirm !== member.id &&
          host.id === store.me.id &&
          host.id !== member.id
        "
        :disabled="isSubmitting"
        name="md-staroutline"
        offset="-2rem"
        tooltip="ホストを移動"
        @click="moveHostConfirm = member.id"
      />
    </div>
    <div
      class="w-full sticky bottom-0 py-2 left-0 bg-black transition-opacity grid place-content-center"
      :class="{
        'text-red-500': popupType === 'error',
        'text-green-500': popupType === 'info',
      }"
      :style="{ opacity: popupCount > 0 ? 1 : 0 }"
    >
      {{ popup }}
    </div>
  </div>
</template>
<style scoped lang="scss"></style>
