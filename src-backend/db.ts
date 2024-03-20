import consola from "consola"
import { Redis } from "ioredis"
import { Position } from "~types/type.js"

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"

export const redis = new Redis(redisUrl)

export type DbSessionVideo = {
  videoId: string
  requestedBy: string
  nonce: string
}
export type DbSession = {
  video: DbSessionVideo | null
  startedAt: number
  queue: DbSessionVideo[]
}

export const userToken = (userId: string) => `token:${userId}`
export const createToken = async (userId: string, instanceId: string) => {
  const token = crypto.randomUUID() + "-" + instanceId
  await redis.set(userToken(userId), token)
  return token
}
export const getToken = async (userId: string) => {
  return redis.get(userToken(userId))
}
export const setMember = async (
  roomId: string,
  userId: string,
  data: { position: Position }
) => {
  await redis.set(
    `room:${roomId}:user:${userId}`,
    JSON.stringify(data),
    "EX",
    15
  )
}
export const getMembers = async (roomId: string, userIds: string[]) => {
  const members = await Promise.all(
    userIds.map(async (id) => {
      const data = await redis.get(`room:${roomId}:user:${id}`)
      return data ? JSON.parse(data) : undefined
    })
  )
  return members.filter((m) => m) as { position: Position }[]
}
export const getSession = async (roomId: string): Promise<DbSession> => {
  const sessionRaw = await redis.get(`room:${roomId}:session`)
  if (!sessionRaw) {
    throw new Error("Session does not exist")
  }
  return JSON.parse(sessionRaw)
}
export const keepAliveSession = async (roomId: string) => {
  await redis.expire(`room:${roomId}:session`, 60)
}
export const createSession = async (roomId: string): Promise<DbSession> => {
  const startedAt = Date.now()
  const session = {
    video: null,
    startedAt,
    queue: [],
  }
  await redis.set(`room:${roomId}:session`, JSON.stringify(session), "EX", 60)

  return session
}
export const enqueueVideo = async (
  roomId: string,
  videoId: string,
  userId: string
) => {
  const sessionRaw = await redis.get(`room:${roomId}:session`)
  if (!sessionRaw) {
    throw new Error("Session does not exist")
  }
  const nonce = crypto.randomUUID()
  const session: DbSession = JSON.parse(sessionRaw)
  session.queue.push({ videoId, requestedBy: userId, nonce })
  await redis.set(`room:${roomId}:session`, JSON.stringify(session), "EX", 60)
}
export const dequeueVideo = async (
  roomId: string,
  session: DbSession
): Promise<void> => {
  const videoId = session.queue.shift()
  session.startedAt = Date.now()
  session.video = videoId ?? null
  consola.info(`[${roomId}] Dequeued video: ${videoId}`)
  await redis.set(`room:${roomId}:session`, JSON.stringify(session), "EX", 60)
}
export const cancelVideo = async (roomId: string, nonce: string) => {
  const sessionRaw = await redis.get(`room:${roomId}:session`)
  if (!sessionRaw) {
    throw new Error("Session does not exist")
  }
  const session: DbSession = JSON.parse(sessionRaw)
  session.queue = session.queue.filter((v) => v.nonce !== nonce)
  await redis.set(`room:${roomId}:session`, JSON.stringify(session), "EX", 60)
}
export const getOrCreateSession = async (
  roomId: string
): Promise<DbSession> => {
  const session = await getSession(roomId).catch(() => undefined)
  if (session) {
    return session
  }
  consola.info(`Creating session: ${roomId}`)
  return createSession(roomId)
}
