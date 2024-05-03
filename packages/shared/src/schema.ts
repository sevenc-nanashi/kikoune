import { z } from "zod"

export type SessionVideo = Video & {
  requestedBy: string
  nonce: string
}
export type Session = {
  video: undefined | SessionVideo
  startedAt: number
  host: string
  queue: SessionVideo[]
  setting: SessionSetting
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

export const sessionSettingSchema = z.object({
  queueLimit: z.number().int().min(1),
  queueLocked: z.boolean(),
  queueHidden: z.boolean(),
  random: z.boolean(),
})

export const defaultSessionSetting: SessionSetting = {
  queueLimit: 100,
  queueLocked: false,
  queueHidden: false,
  random: false,
}

export type SessionSetting = z.infer<typeof sessionSettingSchema>

export type MemberState = z.infer<typeof memberStateSchema>
