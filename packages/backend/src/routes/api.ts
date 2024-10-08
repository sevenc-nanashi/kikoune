import { Hono } from "hono"
import {
  RouteBases,
  Routes,
  RESTGetAPIUserResult,
  RESTPostOAuth2AccessTokenResult,
} from "discord-api-types/v10"
import consola from "consola"
import { z } from "zod"
import { zValidator } from "@hono/zod-validator"
import { discordScope } from "@kikoune/shared"
import room from "./room.js"
import * as db from "~/db.ts"
import { env } from "~/const.ts"

const log = consola.withTag("api")

const app = new Hono()
const route = (route: string) => {
  if (route.includes("..")) {
    throw new Error("Invalid route")
  }
  return RouteBases.api + route
}
app.mount("/room", room.fetch)

const fetchWithRateLimit = async (
  url: string,
  init?: RequestInit
): Promise<Response> => {
  const response = await fetch(url, init)
  if (response.status === 429) {
    const retryAfter =
      Number(response.headers.get("x-ratelimit-retry-after")) * 1000
    log.info("Rate limited, retrying after", retryAfter)
    await new Promise((resolve) => setTimeout(resolve, retryAfter))
    return fetchWithRateLimit(url, init)
  }
  return response
}

app.post(
  "/auth",
  zValidator(
    "json",
    z.object({
      code: z.string(),
      instanceId: z.string(),
    })
  ),
  async (c) => {
    const body = await c.req.json()
    const response = (await fetchWithRateLimit(
      route(Routes.oauth2TokenExchange()),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: env.discordId,
          client_secret: env.discordSecret,
          grant_type: "authorization_code",
          scope: discordScope.join(" "),
          code: body.code,
        }),
      }
    ).then((res) => res.json())) as RESTPostOAuth2AccessTokenResult
    if (!response.access_token) {
      c.status(400)
      return c.json({ error: "Invalid code" })
    }
    const discordAccessToken = response.access_token
    const user = (await fetchWithRateLimit(route(Routes.user("@me")), {
      headers: {
        Authorization: `Bearer ${discordAccessToken}`,
      },
    }).then((res) => res.json())) as RESTGetAPIUserResult
    const kikouneAccessToken = await db.createToken(user.id, body.instanceId)
    log.info(`User authenticated: ${user.id} in ${body.instanceId}`)
    return c.json({ userId: user.id, discordAccessToken, kikouneAccessToken })
  }
)
app.get("/time", async (c) => {
  return c.json({ time: Date.now() })
})

export default app
