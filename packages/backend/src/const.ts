export const host = `https://${process.env.VITE_DISCORD_ID}.discordsays.com`

const discordId = process.env.VITE_DISCORD_ID
if (!discordId) {
  throw new Error("Discord client ID is not set")
}
const discordSecret = process.env.DISCORD_SECRET
if (!discordSecret) {
  throw new Error("Discord client secret is not set")
}
export const env = { discordId, discordSecret } as const
