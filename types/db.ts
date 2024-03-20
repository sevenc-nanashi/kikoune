import { z } from "zod"

export type Session = {
  videoId: string | undefined
  startedAt: number
  willEndAt: number | undefined
  queue: string[]
}

export const memberSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
})

export type Member = z.infer<typeof memberSchema>
