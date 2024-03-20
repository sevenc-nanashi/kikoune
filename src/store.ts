import { defineStore } from "pinia"
import { Participant } from "./plugins/useDiscordSdk"
import { MemberState, Session } from "~types/type.js"

export const useStore = defineStore("auth", {
  state: () => ({
    _token: "",
    session: {
      queue: [],
      startedAt: 0,
      video: undefined,
    } as Session,
    memberStates: {} as Record<string, MemberState>,
    _me: undefined as Participant | undefined,
    stateOverride: {} as Partial<MemberState>,
    stateOverrideUpdatedAt: 0,
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
  },
  actions: {
    async setToken(token: string) {
      this._token = token
    },
    async setSession(session: Session) {
      this.session = session
    },
    async setMemberStates(memberState: Record<string, MemberState>) {
      this.memberStates = memberState
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
      return user.nickname || user.global_name || user.username || "Unknown"
    },

    resetStateOverride() {
      this.stateOverride = {}
    },
    setStateOverride(state: Partial<MemberState>) {
      this.stateOverride = {
        ...this.stateOverride,
        ...state,
      }
      this.stateOverrideUpdatedAt = Date.now()
    },
  },
})
