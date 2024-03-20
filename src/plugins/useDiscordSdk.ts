import { Plugin, inject } from "vue"
import { DiscordSDK, CommandResponseTypes } from "@discord/embedded-app-sdk"

export type Participant =
  CommandResponseTypes["getInstanceConnectedParticipants"]["participants"][0]

export const discordSdkPlugin: Plugin = {
  install: (app) => {
    const sdk = new DiscordSDK(import.meta.env.VITE_DISCORD_ID)
    app.provide("discordSdk", sdk)
  },
}

export const useDiscordSdk = () => {
  return inject("discordSdk") as DiscordSDK
}
