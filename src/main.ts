import { createApp } from "vue"
import { createPinia } from "pinia"
import { OhVueIcon, addIcons } from "oh-vue-icons"
import { MdSend, MdOpeninnew, MdDelete } from "oh-vue-icons/icons"
import { discordSdkPlugin } from "./plugins/useDiscordSdk"
import App from "./App.vue"
import "./style.scss"

addIcons(MdSend, MdOpeninnew, MdDelete)

const pinia = createPinia()
createApp(App)
  .component("v-icon", OhVueIcon)
  .use(pinia)
  .use(discordSdkPlugin)
  .mount("#app")
