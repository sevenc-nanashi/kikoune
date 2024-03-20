import consola from "consola"
import { Redis } from "ioredis"
import { Member, Session } from "~types/db"

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"

export const redis = new Redis(redisUrl)

export const userToken = (userId: string) => `token:${userId}`
export const createToken = async (userId: string, channelId: string) => {
  const token = crypto.randomUUID() + "-" + channelId
  await redis.set(userToken(userId), token)
  return token
}
export const getToken = async (userId: string) => {
  return redis.get(userToken(userId))
}
export const getMembers = async (roomId: string) => {
  const keys = await redis.keys(`room:${roomId}:user:*`)
  return await redis.mget(keys).then((values) =>
    keys
      .map(
        (key, i) =>
          values[i] && {
            userId: key.split(":")[2],
            position: JSON.parse(values[i]!) as {
              x: number
              y: number
            },
          }
      )
      .flatMap((x) => x || [])
  )
}
export const setMember = async (
  roomId: string,
  userId: string,
  data: Member
) => {
  await redis.set(
    `room:${roomId}:user:${userId}`,
    JSON.stringify(data),
    "EX",
    15
  )
}
export const getSession = async (
  roomId: string
): Promise<Session | undefined> => {
  const isAlive = await redis.exists(`room:${roomId}:session`)
  if (isAlive === 0) {
    return undefined
  }
  const videoId = await redis.get(`room:${roomId}:session:videoId`)
  const startedAt = Number(await redis.get(`room:${roomId}:session:startedAt`))
  const willEndAt = await redis.get(`room:${roomId}:session:willEndAt`)
  const queue = await redis.lrange(`room:${roomId}:session:queue`, 0, -1)
  return {
    videoId: videoId ?? undefined,
    startedAt,
    willEndAt: willEndAt ? Number(willEndAt) : undefined,
    queue,
  }
}
export const keepAliveSession = async (roomId: string) => {
  await redis.set(`room:${roomId}:session`, "alive", "EX", 60)
}
export const createSession = async (roomId: string): Promise<Session> => {
  const startedAt = Date.now()
  await redis.set(`room:${roomId}:session:startedAt`, startedAt)
  await redis.del(
    `room:${roomId}:session:videoId`,
    `room:${roomId}:session:willEndAt`
  )

  await redis.ltrim(`room:${roomId}:session:queue`, 0, 0)

  return {
    videoId: undefined,
    startedAt,
    willEndAt: undefined,
    queue: [],
  }
}
export const getOrCreateSession = async (
  roomId: string
): Promise<{
  videoId: string | undefined
  startedAt: number
  willEndAt: number | undefined
  queue: string[]
}> => {
  const session = await getSession(roomId)
  if (session) {
    return session
  }
  consola.info(`Creating session: ${roomId}`)
  return createSession(roomId)
}
