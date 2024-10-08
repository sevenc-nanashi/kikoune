import consola from "consola"
import { Redis } from "ioredis"
import {
  MemberState,
  SessionSetting,
  defaultSessionSetting,
} from "@kikoune/shared"

const log = consola.withTag("db")

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
  host: string
  setting: SessionSetting
}

export const userToken = (userId: string) => `token:${userId}`
export const createToken = async (userId: string, instanceId: string) => {
  const token = crypto.randomUUID() + ":" + instanceId
  await redis.set(userToken(userId), token)
  return token
}
export const getToken = async (userId: string) => {
  return redis.get(userToken(userId))
}
export const setMemberState = async (
  roomId: string,
  userId: string,
  state: MemberState
) => {
  await redis.set(roomUser(roomId, userId), JSON.stringify(state), "EX", 15)
}
const roomUser = (roomId: string, userId: string) =>
  `room:${roomId}:user:${userId}`
const roomSession = (roomId: string) => `room:${roomId}:session`
export const getMemberStates = async (roomId: string, userIds: string[]) => {
  const members = (
    await Promise.all(
      userIds.map(async (id) => {
        const data = await redis.get(roomUser(roomId, id))
        return data ? [id, JSON.parse(data)] : undefined
      })
    )
  ).filter(Boolean) as [string, MemberState][]
  return Object.fromEntries(members)
}
export const getMemberState = async (roomId: string, userId: string) => {
  const data = await redis.get(roomUser(roomId, userId))
  if (!data) {
    throw new Error("Member does not exist")
  }
  return JSON.parse(data)
}
export const getSession = async (roomId: string): Promise<DbSession> => {
  const sessionRaw = await redis.get(roomSession(roomId))
  if (!sessionRaw) {
    throw new Error("Session does not exist")
  }
  return JSON.parse(sessionRaw)
}
export const keepAliveSession = async (roomId: string) => {
  await redis.expire(roomSession(roomId), 60)
}
export const createSession = async (
  roomId: string,
  host: string
): Promise<DbSession> => {
  const startedAt = Date.now()
  const session = {
    video: null,
    startedAt,
    queue: [],
    host,
    setting: defaultSessionSetting,
  }
  await redis.set(roomSession(roomId), JSON.stringify(session), "EX", 60)

  return session
}
export const enqueueVideo = async (
  roomId: string,
  videoId: string,
  userId: string
) => {
  const sessionRaw = await redis.get(roomSession(roomId))
  if (!sessionRaw) {
    throw new Error("Session does not exist")
  }
  const nonce = crypto.randomUUID()
  const session: DbSession = JSON.parse(sessionRaw)
  session.queue.push({ videoId, requestedBy: userId, nonce })
  await redis.set(roomSession(roomId), JSON.stringify(session), "EX", 60)
}
export const dequeueVideo = async (
  roomId: string,
  session: DbSession
): Promise<void> => {
  let videoId: DbSessionVideo | undefined

  if (session.setting.random) {
    videoId = session.queue.splice(
      Math.floor(Math.random() * session.queue.length),
      1
    )[0]
  } else {
    videoId = session.queue.shift()
  }
  session.startedAt = Date.now()
  session.video = videoId ?? null
  log.info(`[${roomId}] Dequeued video: ${videoId?.videoId}`)
  await redis.set(roomSession(roomId), JSON.stringify(session), "EX", 60)
}
export const cancelVideo = async (roomId: string, nonce: string) => {
  const sessionRaw = await redis.get(roomSession(roomId))
  if (!sessionRaw) {
    throw new Error("Session does not exist")
  }
  const session: DbSession = JSON.parse(sessionRaw)
  session.queue = session.queue.filter((v) => v.nonce !== nonce)
  await redis.set(roomSession(roomId), JSON.stringify(session), "EX", 60)
}
export const getOrCreateSession = async (
  roomId: string,
  host: string
): Promise<DbSession> => {
  const session = await getSession(roomId).catch(() => undefined)
  if (session) {
    return session
  }
  log.info(`Creating session: ${roomId} by ${host}`)
  return createSession(roomId, host)
}

export const keepAliveMembers = async (roomId: string, userIds: string[]) => {
  await Promise.all(userIds.map((id) => redis.expire(roomUser(roomId, id), 15)))
}
export const skipVideo = async (roomId: string) => {
  const session = await getSession(roomId)
  if (!session.video) {
    return
  }
  await dequeueVideo(roomId, session)
}
export const setHost = async (roomId: string, host: string) => {
  const session = await getSession(roomId)
  session.host = host
  await redis.set(roomSession(roomId), JSON.stringify(session), "EX", 60)
}

export const reorderQueue = async (roomId: string, queue: string[]) => {
  const session = await getSession(roomId)
  const reorderedQueue = queue
    .map((id) => session.queue.find((v) => v.nonce === id))
    .filter(Boolean) as DbSessionVideo[]
  const missed = session.queue.filter((v) => !queue.includes(v.nonce))

  session.queue = reorderedQueue.concat(missed)

  await redis.set(roomSession(roomId), JSON.stringify(session), "EX", 60)
}

export const setSetting = async (roomId: string, setting: SessionSetting) => {
  const session = await getSession(roomId)
  session.setting = setting
  await redis.set(roomSession(roomId), JSON.stringify(session), "EX", 60)
}
