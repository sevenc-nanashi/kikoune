import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v10"
import { config } from "dotenv"

config({ path: "../../.env" })

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!)
const clientId = process.env.VITE_DISCORD_ID!

const me = await rest.get(Routes.user("@me"))
console.log(`Logged in as ${me.username}`)

await rest.put(Routes.applicationCommands(clientId), {
  body: [
    {
      type: 4,
      name: "launch",
      description: "Kikouneを起動します。",
      handler: 2,
    },
  ],
})

console.log("Successfully registered application commands.")
