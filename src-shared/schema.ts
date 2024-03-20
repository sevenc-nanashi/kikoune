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
export const memberStateSchema = z.object({
  x: z.number(),
  y: z.number(),
  rotate: z.boolean(),
  message: z.string(),
})
export const defaultMemberState: MemberState = {
  x: 0,
  y: 0,
  rotate: false,
  message: "",
}

export type MemberState = z.infer<typeof memberStateSchema>
