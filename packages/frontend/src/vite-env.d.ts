/// <reference types="vite/client" />
/// <reference types="vite-svg-loader" />

declare module "*.vue" {
  import type { defineComponent } from "vue"
  const component: ReturnType<typeof defineComponent>
  export default component
}
