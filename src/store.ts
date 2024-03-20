import { defineStore } from "pinia"
import { Participant } from "./plugins/useDiscordSdk"
import { Position, Session } from "~types/type.js"

export const useStore = defineStore("auth", {
  state: () => ({
    _token: "",
    session: {
      queue: [],
      startedAt: 0,
      video: undefined,
    } as Session,
    positions: {} as Record<string, Position>,
    _me: undefined as Participant | undefined,
    participants: [] as Participant[],
    view: "login" as "login" | "main" | "error",
  }),
  getters: {
    token(state) {
      if (!state._token) {
        throw new Error("Token is not set")
      }
      return state._token
    },
    me(state) {
      if (!state._me) {
        throw new Error("Me is not set")
      }
      return state._me
    },
    myPosition(state) {
      return state.positions[state._me?.id || ""]
    },
  },
  actions: {
    async setToken(token: string) {
      this._token = token
    },
    async setSession(session: Session) {
      this.session = session
    },
    async setPositions(positions: Record<string, Position>) {
      this.positions = positions
    },
    async panic() {
      this.setView("error")
    },
    setView(view: "login" | "main" | "error") {
      this.view = view
    },
    setMe(me: Participant) {
      this._me = me
    },
    setParticipants(participants: Participant[]) {
      this.participants = participants
    },

    getUser(id: string) {
      return this.participants.find((user) => user.id === id)
    },
    getAvatarUrl(id: string) {
      const user = this.getUser(id)
      if (!user) return "https://cdn.discordapp.com/embed/avatars/0.png"
      if (user.avatar) {
        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      } else {
        return `https://cdn.discordapp.com/embed/avatars/${(parseInt(user.id) >> 22) % 6}.png`
      }
    },
    getName(id: string) {
      const user = this.getUser(id)
      if (!user) return "Unknown"
      return user.nickname || user.username || user.global_name || "Unknown"
    },
  },
})
