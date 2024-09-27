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
  MdStaroutline,
  MdPeople,
  MdInfo,
  MdHome,
  MdBuild,
  MdZoomin,
  MdZoomout,
  MdSettings,
  MdBugreport,
} from "oh-vue-icons/icons"
import { patchUrlMappings } from "@discord/embedded-app-sdk"
import { discordSdkPlugin } from "./plugins/useDiscordSdk.ts"
import App from "./App.vue"
import "./style.scss"

addIcons(
  MdOpeninnew,
  MdDelete,
  MdFastforward,
  MdStar,
  MdStaroutline,
  MdClose,
  MdCheck,
  MdMessage,
  MdRefresh,
  MdQueuemusic,
  MdPeople,
  MdInfo,
  MdHome,
  MdBuild,
  MdZoomin,
  MdZoomout,
  MdSettings,
  MdBugreport
)

patchUrlMappings([
  {
    prefix: "/api",
    target: `${location.origin}/api`,
  },
])

const pinia = createPinia()
createApp(App)
  .component("v-icon", OhVueIcon)
  .use(pinia)
  .use(discordSdkPlugin)
  .mount("#app")
