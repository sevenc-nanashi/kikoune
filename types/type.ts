import { z } from "zod"

export type SessionVideo = Video & {
  requestedBy: string
  nonce: string
}
export type Session = {
  video: undefined | SessionVideo
  startedAt: number
  queue: SessionVideo[]
}

export type Video = {
  id: string
  title: string
  author: string
  thumbnailUrl: string
  length: number
}
export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

export type Position = z.infer<typeof positionSchema>
