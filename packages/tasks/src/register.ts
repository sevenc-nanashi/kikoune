import { REST } from "@discordjs/rest"
import { RESTGetAPIUserResult, Routes } from "discord-api-types/v10"
import { config } from "dotenv"

config({ path: "../../.env" })

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!)

const me = (await rest.get(Routes.user("@me"))) as RESTGetAPIUserResult
console.log(`Logged in as ${me.username}`)

await rest.put(Routes.applicationCommands(me.id), {
  body: [
    {
      type: 4,
      name: "launch",
      description: "Kikouneを起動します。",
      handler: 2,
      integration_types: [0, 1],
    },
  ],
})

console.log("Successfully registered application commands.")
