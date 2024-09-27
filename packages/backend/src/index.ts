import { relative } from "path"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import { logger } from "hono/logger"
import consola from "consola"

import nicoEdit from "./nicoEdit.js"
import api from "./api.js"

const app = new Hono()
const log = consola.withTag("app")
app.use(logger())
app.mount("/nico", nicoEdit.fetch)
app.mount("/api", api.fetch)

if (process.env.NODE_ENV === "production") {
  log.info(`Serving static files from ${import.meta.dirname}`)
  app.use(
    "*",
    serveStatic({
      root: relative(process.cwd(), import.meta.dirname),
      index: "index.html",
    })
  )
} else {
  log.info("Redirecting to Vite server")
  app.get("/", async (c) => c.redirect("http://localhost:1103"))
}
serve(
  {
    fetch: app.fetch,
    port: 1104,
  },
  () => {
    log.info("Server is running at http://localhost:1104")
  }
)
