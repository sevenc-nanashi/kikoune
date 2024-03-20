import { defineStore } from "pinia"

export const useStore = defineStore("auth", {
  state: () => ({
    _token: "",
  }),
  getters: {
    token(state) {
      if (!state._token) {
        throw new Error("Token is not set")
      }
      return state._token
    },
  },
  actions: {
    async setToken(token: string) {
      this._token = token
    },
  },
})
