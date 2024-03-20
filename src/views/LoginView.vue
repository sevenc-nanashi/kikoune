<script setup lang="ts">
import { onMounted, ref } from "vue"
import consola from "consola"
import { useDiscordSdk } from "~/plugins/useDiscordSdk"
import { useStore } from "~/store"

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
    scope: ["identify", "guilds"],
  })

  const response = await fetch("/api/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, channelId: discordSdk.channelId }),
  })
  if (!response.ok) {
    throw new Error("Failed to authenticate")
  }
  const body = await response.json()
  await discordSdk.commands.authenticate({
    access_token: body.discordAccessToken,
  })

  await store.setToken(body.kikouneAccessToken)
}
onMounted(async () => {
  try {
    await authorize()
  } catch (e) {
    consola.error(e)
    error.value = "ログインに失敗しました。"
  }
})
</script>
<template>
  <div
    class="w-screen h-screen relative place-items-center place-content-center grid"
  >
    <h1 class="text-9xl font-extrabold">Kikoune</h1>
    <p class="text-2xl">
      Developed by
      <a target="_blank" class="text-[#48b0d5]" href="https://sevenc7c.com"
        >Nanashi.</a
      >
    </p>
    <hr class="border-b-[1px] border-white w-full my-5" />
    <p v-if="error" class="text-2xl text-red-500">{{ error }}</p>
    <p v-else class="text-2xl">ログイン中...</p>
  </div>
</template>
<style lang="scss"></style>
