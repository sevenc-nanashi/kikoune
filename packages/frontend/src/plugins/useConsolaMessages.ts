import { Plugin, inject, ref } from "vue"
import { consola, LogObject } from "consola"
import { Ref } from "vue"

export const useConsolaMessages = () => {
  const logObjects = inject<Ref<LogObject[]>>("logObjects")
  if (!logObjects) {
    throw new Error("Assertion failed: logObjects should be provided")
  }

  return logObjects
}

export const consolaReporterPlugin: Plugin = {
  install: (app) => {
    const logObjects = ref<LogObject[]>([])
    consola.addReporter({
      log: (logObj) => {
        logObjects.value.push(logObj)
      },
    })

    app.provide("logObjects", logObjects)
  },
}
