import { Hono } from "hono"
import consola from "consola"
import { zValidator } from "@hono/zod-validator"
import AsyncLock from "async-lock"
import * as db from "./db.js"
import { memberSchema } from "~types/db.js"

const app = new Hono<{
  Variables: { userId: string }
}>()
const lock = new AsyncLock()

app.use(async (c, next) => {
  const auth = c.req.header("authorization")
  if (!auth) {
    c.status(401)
    return c.json({ error: "Unauthorized" })
  }
  const [id, token] = auth.split(" ")

  const userToken = await db.getToken(id)
  if (userToken !== token || !userToken) {
    c.status(401)
    consola.info("Unauthorized", id, token, userToken)
    return c.json({ error: "Unauthorized" })
  }
  c.set("userId", id)
  await next()
})

app.put("/:id{[0-9]+}", zValidator("json", memberSchema), async (c) => {
  return await lock.acquire(c.req.param("id"), async () => {
    await db.keepAliveSession(c.req.param("id"))
    const data = c.req.valid("json")
    await db.setMember(c.req.param("id"), c.get("userId"), data)
    const members = await db.getMembers(c.req.param("id"))
    const session = await db.getOrCreateSession(c.req.param("id"))
    return c.json({ members, session })
  })
})

export default app
