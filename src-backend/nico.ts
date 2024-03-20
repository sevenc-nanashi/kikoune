import fetch from "node-fetch"
import { XMLParser } from "fast-xml-parser"
import ExpiryMap from "expiry-map"
import { DbSession } from "./db.js"
import { Session, Video } from "~types/type.js"

const videoCache = new ExpiryMap<string, Video>(1000 * 60 * 60)

export const getVideo = async (id: string): Promise<Video> => {
  if (videoCache.has(id)) {
    return videoCache.get(id)!
  }
  const res = await fetch(`https://ext.nicovideo.jp/api/getthumbinfo/${id}`, {
    headers: {
      "user-agent": "Kikoune, https://github.com/sevenc-nanashi/kikoune",
    },
  })
  const text = await res.text()
  const data = new XMLParser().parse(text)
  if (!data.nicovideo_thumb_response.thumb) {
    throw new Error("Video not found")
  }

  const [min, sec] = data.nicovideo_thumb_response.thumb.length
    .split(":")
    .map(Number)
  return {
    author: data.nicovideo_thumb_response.thumb.user_nickname,
    id: data.nicovideo_thumb_response.thumb.video_id,
    length: min * 60 + sec,
    thumbnailUrl: data.nicovideo_thumb_response.thumb.thumbnail_url,
    title: data.nicovideo_thumb_response.thumb.title,
  }
}

export const fetchSession = async (session: DbSession): Promise<Session> => {
  return {
    video: session.video
      ? {
          ...(await getVideo(session.video.videoId)),
          ...session.video,
        }
      : undefined,
    startedAt: session.startedAt,
    queue: await Promise.all(
      session.queue.map(async (v) => ({
        ...(await getVideo(v.videoId)),
        ...v,
      }))
    ),
  }
}
