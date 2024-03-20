import { Plugin, inject } from "vue"
import { DiscordSDK } from "@discord/embedded-app-sdk"

export const discordSdkPlugin: Plugin = {
  install: (app) => {
    app.provide("discordSdk", new DiscordSDK(import.meta.env.VITE_DISCORD_ID))
  },
}

export const useDiscordSdk = () => {
  return inject("discordSdk") as DiscordSDK
}
