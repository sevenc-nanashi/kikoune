import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { logger } from "hono/logger"
import consola from "consola/basic"

import nicoEdit from "./nicoEdit.js"
import api from "./api.js"

const app = new Hono()
const log = consola.withTag("app")
app.use(logger())
app.mount("/nico", nicoEdit.fetch)
app.mount("/api", api.fetch)

app.get("/", async (c) => c.text("Hello, World!"))
serve(
  {
    fetch: app.fetch,
    port: 1104,
  },
  () => {
    log.info("Server is running at http://localhost:1104")
  }
)
