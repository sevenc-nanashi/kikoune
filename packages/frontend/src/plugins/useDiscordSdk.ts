import { Plugin, inject } from "vue"
import { DiscordSDK, CommandResponseTypes } from "@discord/embedded-app-sdk"
import data from "~/lib/data.ts"

export type Participant =
  CommandResponseTypes["getInstanceConnectedParticipants"]["participants"][0]

export const discordSdkPlugin: Plugin = {
  install: (app) => {
    const sdk = new DiscordSDK(data.discordClientId)
    app.provide("discordSdk", sdk)
  },
}

export const useDiscordSdk = () => {
  return inject("discordSdk") as DiscordSDK
}
