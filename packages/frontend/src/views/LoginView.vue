<script setup lang="ts">
import { watch } from "vue"
import consola from "consola/browser"
import { Common } from "@discord/embedded-app-sdk"
import { discordScope } from "@kikoune/shared"
import LogoSvg from "@kikoune/shared/assets/logo_wide.svg?component"
import BuildInfo from "~/components/BuildInfo.vue"
import { useDiscordSdk } from "~/plugins/useDiscordSdk.ts"
import { useStore } from "~/store.ts"
import data from "~/lib/data.ts"

const discordSdk = useDiscordSdk()
const store = useStore()
const log = consola.withTag("LoginView")

const authorize = async () => {
  log.info("Waiting for Discord SDK to be ready")
  await discordSdk.ready()
  log.info("Authorizing with Discord")
  const { code } = await discordSdk.commands.authorize({
    client_id: data.discordClientId,
    response_type: "code",
    state: "",
    prompt: "none",
    // @ts-expect-error 多分大丈夫
    scope: discordScope,
  })

  log.info("Requesting authentication")
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
  const body = (await response.json()) as {
    discordAccessToken: string
    kikouneAccessToken: string
    userId: string
  }
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
    log.info("Already authenticated")
  }

  await store.setToken(body.kikouneAccessToken)

  log.info("Fetching participants")
  discordSdk.subscribe("ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE", (event) => {
    store.setParticipants(event.participants)
  })
  discordSdk.commands.setOrientationLockState({
    lock_state: Common.OrientationLockStateTypeObject.PORTRAIT,
    picture_in_picture_lock_state:
      Common.OrientationLockStateTypeObject.LANDSCAPE,
    grid_lock_state: Common.OrientationLockStateTypeObject.LANDSCAPE,
  })
  const participants = await discordSdk.commands
    .getInstanceConnectedParticipants()
    .then((res) => res.participants)
  store.setParticipants(participants)
  const me = participants.find((user) => user.id === body.userId)
  if (!me) {
    throw new Error("Failed to fetch me")
  }
  store.setMe(me)

  log.info("Fetching time")
  const currentTime = Date.now()
  const { time } = (await fetch("/api/time").then((res) => res.json())) as {
    time: number
  }

  const requestTime = Date.now() - currentTime
  store.setDelay(time - currentTime - requestTime)
  log.info(
    `Ready. Delay: ${store.delay}ms, Participants: ${participants.length}`
  )

  store.setView("main")
}

watch(
  () => store.view,
  (view) => {
    if (view === "login") {
      authorize().catch((e) => {
        log.error(e)
        store.panic()
      })
    }
  },
  { immediate: true }
)

const isBrowser = !(
  navigator.userAgent.includes("Mobile") ||
  navigator.userAgent.includes("discord")
)
</script>
<template>
  <div
    class="w-screen h-screen place-items-center place-content-center grid bg-gray-900 z-100"
  >
    <div class="absolute inset-0 cursor-wait" />
    <LogoSvg class="h-12 sm:h-32" />
    <p class="text-xl sm:text-2xl">
      Developed by
      <span class="text-[#48b0d5]">Nanashi.</span>
    </p>
    <hr class="border-b-[1px] border-white w-full my-2 xs:my-5" />
    <p class="text-xl sm:text-2xl">ログイン中...</p>
    <p v-if="isBrowser" class="text-xl">
      アプリ版から参加することを推奨します。
    </p>
    <BuildInfo />
  </div>
</template>
<style lang="scss"></style>
