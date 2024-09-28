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
import { consolaReporterPlugin } from "./plugins/useConsolaMessages.ts"

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
;(async () => {
  if (typeof window === "undefined") return

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ts-expect-errorだとエラーになる
  // @ts-ignore 何故か型がない
  import("budoux/module/webcomponents/budoux-ja")
})()

const pinia = createPinia()
createApp(App)
  .component("v-icon", OhVueIcon)
  .use(pinia)
  .use(discordSdkPlugin)
  .use(consolaReporterPlugin)
  .mount("#app")
