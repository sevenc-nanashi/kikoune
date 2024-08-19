import { Hono } from "hono"
import { host } from "./const.js"

const app = new Hono()
const withParams = (url: string, obj: Record<string, string>) =>
  url + "?" + new URLSearchParams(obj).toString()

const replaceToExternal = (src: string) =>
  src
    .replace(
      /https?:\/\/assets\.embed\.res\.nimg\.jp\/js\/(.+?).js/g,
      "/nico/watch/$1"
    )
    .replace("https://stella.nicovideo.jp", "/.proxy/nico/stella")
    .replace(
      /https?:\/\/res\.ads\.nicovideo.jp/g,
      "/.proxy/external/res-ads-nicovideo-jp"
    )
    .replace(/\/users/g, "/../../nico/users")
    .replace(/\/v1\/watch\/(?!non)/g, "/../../nico/v1-watch/")
    // .replace(
    //   /https?:\/\/(?:\/\/)?([^/]+?)\.nicovideo\.jp/g,
    //   host + "/external/$1-nicovideo-jp"
    // )
    .replace(
      /https?:(?:\/\/|\\\/\\\/)([^/]+?)\.nicovideo\.jp/g,
      (_match, p1) =>
        host + "/.proxy/external/" + p1.replaceAll(".", "-") + "-nicovideo-jp"
    )
    .replace(
      /https?:(?:\/\/|\\\/\\\/)([^/]+?)\.cdn\.nimg\.jp/g,
      host + "/.proxy/external/$1-cdn-nimg-jp"
    )
    .replace(
      /https?:\/\/assets\.embed\.res\.nimg\.jp/g,
      "/.proxy/external/assets-embed-res-nimg-jp"
    )

app.get("/nico-embed/:id", async (c) => {
  const id = c.req.param("id")
  const html = await fetch(
    `https://embed.nicovideo.jp/watch/${id}?${c.req.raw.url.split("?")[1]}`,
    {
      headers: {
        "Accept-Language": "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    }
  ).then((res) => res.text())
  return c.html(replaceToExternal(html))
})
app.get("/watch/:id{.+}", async (c) => {
  const id = c.req.param("id")
  const js = await fetch(`https://assets.embed.res.nimg.jp/js/${id}.js`).then(
    (res) => res.text()
  )

  c.header("Content-Type", "application/javascript")
  return c.text(
    replaceToExternal(js)
      .replace(/\/api\/watch/g, "/.proxy/nico/api-watch")
      .replace(/\/v1\/recommend\?/g, "/../../nico/nvapi-recommend?")
  )
})
app.post("/stella/v1/watch/:id{.+}", async (c) => {
  const id = c.req.param("id")
  const stellaData = await fetch(`https://stella.nicovideo.jp/v1/watch/${id}`, {
    method: "POST",
    headers: {
      cookie: c.req.header("cookie")!,
      origin: "https://embed.nicovideo.jp",
      referer: "https://embed.nicovideo.jp/",
      "user-agent": c.req.header("user-agent")!,
      "x-frontend-id": c.req.header("x-frontend-id")!,
      "content-type": "application/json",
    },
    body: JSON.stringify(await c.req.json()),
  }).then((res) => res.json())

  return c.json(stellaData)
})
app.get("/users/:id{.+}", async (c) => {
  const id = c.req.param("id")
  const userData = await fetch(`https://embed.nicovideo.jp/users/${id}`).then(
    (res) => res.text()
  )
  return c.json(JSON.parse(replaceToExternal(userData)))
})
app.post("/v1-watch/:id/:rest{.+}", async (c) => {
  const id = c.req.param("id")
  const json = await fetch(
    withParams(`https://nvapi.nicovideo.jp/v1/watch/${id}/access-rights/hls`, {
      actionTrackId: c.req.query("actionTrackId")!,
    }),
    {
      method: "POST",
      body: JSON.stringify(await c.req.json()),
      headers: {
        origin: "https://embed.nicovideo.jp",
        referer: "https://embed.nicovideo.jp/",
        "user-agent": c.req.header("user-agent")!,
        "x-access-right-key": c.req.header("x-access-right-key")!,
        "x-frontend-id": c.req.header("x-frontend-id")!,
        "x-frontend-version": c.req.header("x-frontend-version")!,
        "x-request-with": c.req.header("x-request-with")!,
        "content-type": "application/json",
      },
    }
  ).then((res) => res.text())
  return c.json(
    JSON.parse(
      json.replace(
        /https?:\/\/delivery\.domand\.nicovideo\.jp\/hlsext\/(.+?)\.m3u8/g,
        host + "/.proxy/nico/delivery-domand-nicovideo-jp/hlsext/$1.m3u8"
      )
    )
  )
})
app.get("/api-watch/:rest{.+}", async (c) => {
  const rest = c.req.param("rest")
  const json = await fetch(
    withParams(`https://www.nicovideo.jp/api/watch/${rest}`, c.req.query()),
    {
      headers: {
        origin: "https://embed.nicovideo.jp",
        referer: "https://embed.nicovideo.jp/",
      },
    }
  ).then((res) => res.text())
  return c.json(JSON.parse(replaceToExternal(json)))
})

app.get("/delivery-domand-nicovideo-jp/:rest{.+}", async (c) => {
  const rest = c.req.param("rest")
  const res = await fetch(
    withParams(`https://delivery.domand.nicovideo.jp/${rest}`, c.req.query())
  )
  for (const [key, value] of res.headers.entries()) {
    if (key.toLowerCase() === "transfer-encoding") continue

    c.header(key, value)
  }
  return c.body(
    (await res.text())
      .replace(
        /https:\/\/asset\.domand\.nicovideo\.jp/g,
        host + "/.proxy/external/asset-domand-nicovideo-jp"
      )
      .replace(
        /https:\/\/delivery\.domand\.nicovideo\.jp\/hlsext\/(.+?)\.m3u8/g,
        host + "/.proxy/nico/delivery-domand-nicovideo-jp/hlsext/$1.m3u8"
      )
      .replace(
        /https:\/\/delivery\.domand\.nicovideo\.jp/g,
        host + "/.proxy/external/delivery-domand-nicovideo-jp"
      ),
    200
  )
})
app.get("/nvapi-recommend", async (c) => {
  const res = await fetch(
    withParams("https://nvapi.nicovideo.jp/v1/recommend", c.req.query())
  ).then((res) => res.text())
  return c.json(JSON.parse(replaceToExternal(res)))
})
export default app
