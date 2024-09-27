const dataElement = document.getElementById("data")
const data: {
  discordClientId: string
} = (dataElement?.textContent && JSON.parse(dataElement.textContent)) || {
  discordClientId: import.meta.env.VITE_DISCORD_ID,
}

export default data
