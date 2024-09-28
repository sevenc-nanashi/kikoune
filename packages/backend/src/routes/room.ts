import { Hono } from "hono"
import consola from "consola"
import { zValidator } from "@hono/zod-validator"
import AsyncLock from "async-lock"
import { z } from "zod"
import {
  SessionSetting,
  buffer,
  maxMessageLength,
  sessionSettingSchema,
} from "@kikoune/shared"
import { defaultMemberState, memberStateSchema } from "@kikoune/shared"
import * as db from "~/db.js"
import { fetchSession, getVideo } from "~/nico.js"

const app = new Hono<{
  Variables: { userId: string }
}>()
const lock = new AsyncLock()
const log = consola.withTag("room")

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
    log.info("Unauthorized", id, token, userToken)
    return c.json({ error: "Unauthorized" })
  }
  c.set("userId", id)
  await next()
})

app.put(
  "/:id{[0-9a-z-]+?}/sync",
  zValidator("json", z.object({ userIds: z.array(z.string()) })),
  async (c) => {
    return await lock.acquire(c.req.param("id"), async () => {
      await db.keepAliveSession(c.req.param("id"))
      const data = c.req.valid("json")
      await db.keepAliveMembers(c.req.param("id"), data.userIds)
      const memberStates = await db.getMemberStates(
        c.req.param("id"),
        data.userIds
      )
      if (!memberStates[c.get("userId")]) {
        const newState = {
          ...defaultMemberState,
          x: Math.random() * 2 - 1,
          y: Math.random() * 2 - 1,
        }
        await db.setMemberState(c.req.param("id"), c.get("userId"), newState)
        memberStates[c.get("userId")] = newState
      }
      const session = await db.getOrCreateSession(
        c.req.param("id"),
        c.get("userId")
      )
      const video = session.video ? await getVideo(session.video.videoId) : null
      if (
        !video ||
        session.startedAt + video.length * 1000 + (buffer + 2000) < Date.now()
      ) {
        if (!(!session.video && session.queue.length === 0)) {
          log.info(`[${c.req.param("id")}] Dequeueing video`)
          await db.dequeueVideo(c.req.param("id"), session)
        }
      }
      if (!memberStates[session.host]) {
        log.info(
          `[${c.req.param("id")}] Host is not in the room, moving to ${c.get("userId")}`
        )
        await db.setHost(c.req.param("id"), c.get("userId"))
      }
      return c.json({
        memberStates,
        session: await fetchSession(session),
      })
    })
  }
)

app.post(
  "/:id{[0-9a-z-]+?}/queue",
  zValidator("json", z.object({ videoId: z.string() })),
  async (c) => {
    const session = await db.getSession(c.req.param("id")).then(fetchSession)
    const canQueue =
      session.host === c.get("userId") ||
      (session.queue.length < session.setting.queueLimit &&
        !session.setting.queueLocked)
    if (!canQueue) {
      c.status(403)
      return c.json({ error: "Queue is locked" })
    }
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

app.put(
  "/:id{[0-9a-z-]+?}/state",
  zValidator("json", z.object({ state: memberStateSchema.partial() })),
  async (c) => {
    const data = c.req.valid("json")
    await lock.acquire(c.req.param("id"), async () => {
      const state = await db.getMemberState(c.req.param("id"), c.get("userId"))
      state.x = data.state.x ?? state.x
      state.y = data.state.y ?? state.y
      state.rotate = data.state.rotate ?? state.rotate
      state.message = data.state.message ?? state.message
      if (state.message.length > maxMessageLength) {
        state.message = state.message.slice(0, maxMessageLength)
      }

      await db.setMemberState(c.req.param("id"), c.get("userId"), state)
    })

    c.status(204)
    return c.body(null)
  }
)
app.post(
  "/:id{[0-9a-z-]+?}/skip",
  zValidator(
    "json",
    z.object({
      nonce: z.string(),
    })
  ),
  async (c) => {
    return await lock.acquire(c.req.param("id"), async () => {
      const session = await db.getSession(c.req.param("id")).then(fetchSession)
      if (!session.video) {
        c.status(400)
        return c.json({ error: "No video to skip" })
      }
      if (session.video.nonce !== c.req.valid("json").nonce) {
        c.status(400)
        return c.json({ error: "Invalid nonce" })
      }
      if (
        session.video.requestedBy !== c.get("userId") &&
        session.host !== c.get("userId")
      ) {
        c.status(403)
        return c.json({ error: "Forbidden" })
      }
      await db.skipVideo(c.req.param("id"))
      c.status(204)
      return c.body(null)
    })
  }
)
app.put(
  "/:id{[0-9a-z-]+?}/host",
  zValidator(
    "json",
    z.object({
      id: z.string(),
    })
  ),
  async (c) => {
    return await lock.acquire(c.req.param("id"), async () => {
      const session = await db.getSession(c.req.param("id"))
      if (session.host !== c.get("userId")) {
        c.status(403)
        return c.json({ error: "Not the host" })
      }
      await db.setHost(c.req.param("id"), c.req.valid("json").id)

      c.status(204)
      return c.body(null)
    })
  }
)

app.delete("/:id{[0-9a-z-]+?}/queue/:nonce{[0-9a-z-]+?}", async (c) => {
  return await lock.acquire(c.req.param("id"), async () => {
    const session = await db.getSession(c.req.param("id"))
    const video = session.queue.find((v) => v.nonce === c.req.param("nonce"))
    if (!video) {
      c.status(400)
      return c.json({ error: "Invalid nonce" })
    }
    if (
      video?.requestedBy !== c.get("userId") &&
      session.host !== c.get("userId")
    ) {
      c.status(403)
      return c.json({ error: "Forbidden" })
    }
    await db.cancelVideo(c.req.param("id"), c.req.param("nonce"))

    c.status(204)
    return c.body(null)
  })
})
app.put(
  "/:id{[0-9a-z-]+?}/queue",
  zValidator("json", z.object({ order: z.array(z.string()) })),
  async (c) => {
    return await lock.acquire(c.req.param("id"), async () => {
      const session = await db.getSession(c.req.param("id"))
      if (session.host !== c.get("userId")) {
        c.status(403)
        return c.json({ error: "Not the host" })
      }
      const order = c.req.valid("json").order
      await db.reorderQueue(c.req.param("id"), order)

      c.status(204)
      return c.body(null)
    })
  }
)

app.put(
  "/:id{[0-9a-z-]+?}/setting",
  zValidator("json", sessionSettingSchema.partial()),
  async (c) => {
    return await lock.acquire(c.req.param("id"), async () => {
      const session = await db.getSession(c.req.param("id"))
      if (session.host !== c.get("userId")) {
        c.status(403)
        return c.json({ error: "Not the host" })
      }
      const newSetting = c.req.valid("json")
      const setting: SessionSetting = {
        ...session.setting,
        ...newSetting,
      }
      await db.setSetting(c.req.param("id"), setting)

      c.status(204)
      return c.body(null)
    })
  }
)

export default app
