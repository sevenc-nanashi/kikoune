import "@fontsource/zen-kaku-gothic-new/400.css"
import "@fontsource/zen-kaku-gothic-new/500.css"
import "@fontsource/zen-kaku-gothic-new/700.css"
import "./style.scss"
import { ViteSSG } from "vite-ssg/single-page"
import App from "./App.vue"
;(async () => {
  if (typeof window === "undefined") return

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ts-expect-errorだとエラーになる
  // @ts-ignore 何故か型がない
  import("budoux/module/webcomponents/budoux-ja")
})()

export const createApp = ViteSSG(App)
