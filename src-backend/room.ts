import { Hono } from "hono"
import consola from "consola"
import { zValidator } from "@hono/zod-validator"
import AsyncLock from "async-lock"
import { z } from "zod"
import * as db from "./db.js"
import { fetchSession, getVideo } from "./nico.js"
import { positionSchema } from "~types/type.js"

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

app.put(
  "/:id{[0-9a-f-]+?}/sync",
  zValidator(
    "json",
    z.object({ position: positionSchema, userIds: z.array(z.string()) })
  ),
  async (c) => {
    return await lock.acquire(c.req.param("id"), async () => {
      await db.keepAliveSession(c.req.param("id"))
      const data = c.req.valid("json")
      await db.setMember(c.req.param("id"), c.get("userId"), {
        position: data.position,
      })
      const members = await db.getMembers(c.req.param("id"), data.userIds)
      const session = await db.getOrCreateSession(c.req.param("id"))
      const video = session.video ? await getVideo(session.video.videoId) : null
      if (
        !video ||
        session.startedAt + (video.length + 3) * 1000 < Date.now()
      ) {
        if (!(!session.video && session.queue.length === 0)) {
          consola.info(`[${c.req.param("id")}] Dequeueing video`)
          await db.dequeueVideo(c.req.param("id"), session)
        }
      }
      return c.json({ members, session: await fetchSession(session) })
    })
  }
)

app.post(
  "/:id{[0-9a-f-]+?}/queue",
  zValidator("json", z.object({ videoId: z.string() })),
  async (c) => {
    let video
    try {
      video = await getVideo(c.req.valid("json").videoId)
    } catch (e) {
      c.status(400)
      return c.json({ error: "Invalid video" })
    }
    await lock.acquire(c.req.param("id"), async () => {
      await db.enqueueVideo(
        c.req.param("id"),
        c.req.valid("json").videoId,
        c.get("userId")
      )
    })

    return c.json({ video })
  }
)

app.delete("/:id{[0-9a-f-]+?}/queue/:nonce{[0-9a-f-]+?}", async (c) => {
  await lock.acquire(c.req.param("id"), async () => {
    await db.cancelVideo(c.req.param("id"), c.req.param("nonce"))
  })

  c.status(204)
  return c.body(null)
})

export default app
