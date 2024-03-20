import { createApp } from "vue"
import { createPinia } from "pinia"
import { discordSdkPlugin } from "./plugins/useDiscordSdk"
import App from "./App.vue"
import "./style.scss"

const pinia = createPinia()
createApp(App).use(pinia).use(discordSdkPlugin).mount("#app")
