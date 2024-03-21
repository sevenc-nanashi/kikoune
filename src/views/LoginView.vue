<script setup lang="ts">
import { onMounted, ref, watch } from "vue"
import consola from "consola"
import BuildInfo from "~/components/BuildInfo.vue"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"
import { discordScope } from "~shared/const"

const discordSdk = useDiscordSdk()
const store = useStore()
const error = ref<string | undefined>(undefined)
const authorize = async () => {
  await discordSdk.ready()
  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    // @ts-expect-error 多分大丈夫
    scope: discordScope,
  })

  const response = await fetch("/api/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, instanceId: discordSdk.instanceId }),
  })
  if (!response.ok) {
    throw new Error("Failed to authenticate")
  }
  const body = await response.json()
  try {
    await discordSdk.commands.authenticate({
      access_token: body.discordAccessToken,
    })
  } catch (e) {
    if (
      !(
        e &&
        typeof e === "object" &&
        "message" in e &&
        e.message === "Already authenticated"
      )
    ) {
      throw e
    }
    consola.info("Already authenticated")
  }

  await store.setToken(body.kikouneAccessToken)

  consola.info("Fetching participants")
  discordSdk.subscribe("ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE", (event) => {
    store.setParticipants(event.participants)
  })
  const participants = await discordSdk.commands
    .getInstanceConnectedParticipants()
    .then((res) => res.participants)
  consola.info("Fetched participants", participants)
  store.setParticipants(participants)
  const me = participants.find((user) => user.id === body.userId)
  if (!me) {
    throw new Error("Failed to fetch me")
  }
  store.setMe(me)
  store.setView("main")
}
watch(
  () => store.view,
  (view) => {
    if (view === "login") {
      authorize().catch((e) => {
        consola.error(e)
        error.value = "ログインに失敗しました。"
      })
    }
  },
  { immediate: true }
)
</script>
<template>
  <div
    class="w-screen h-screen place-items-center place-content-center grid bg-gray-900"
  >
    <div class="absolute inset-0 cursor-wait" />
    <h1 class="text-9xl font-extrabold">Kikoune</h1>
    <p class="text-2xl">
      Developed by
      <span class="text-[#48b0d5]">Nanashi.</span>
    </p>
    <hr class="border-b-[1px] border-white w-full my-5" />
    <p v-if="error" class="text-2xl text-red-500">{{ error }}</p>
    <p v-else class="text-2xl">ログイン中...</p>
    <BuildInfo />
  </div>
</template>
<style lang="scss"></style>
