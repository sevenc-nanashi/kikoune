import { createApp } from "vue"
import { createPinia } from "pinia"
import { OhVueIcon, addIcons } from "oh-vue-icons"
import {
  MdOpeninnew,
  MdDelete,
  MdFastforward,
  MdStar,
  MdClose,
  MdCheck,
  MdMessage,
  MdRefresh,
  MdQueuemusic,
  MdStarOutlined,
  MdPeople,
  MdInfo,
  MdHome,
} from "oh-vue-icons/icons"
import { discordSdkPlugin } from "./plugins/useDiscordSdk"
import App from "./App.vue"
import "./style.scss"

addIcons(
  MdOpeninnew,
  MdDelete,
  MdFastforward,
  MdStar,
  MdStarOutlined,
  MdClose,
  MdCheck,
  MdMessage,
  MdRefresh,
  MdQueuemusic,
  MdPeople,
  MdInfo,
  MdHome
)

const pinia = createPinia()
createApp(App)
  .component("v-icon", OhVueIcon)
  .use(pinia)
  .use(discordSdkPlugin)
  .mount("#app")
