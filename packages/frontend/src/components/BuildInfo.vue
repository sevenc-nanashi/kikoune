<script setup lang="ts">
const buildInfo = import.meta.env.VITE_COMMIT
const isDev = import.meta.env.DEV
</script>
<template>
  <div
    class="absolute left-3 bottom-3 hidden xs:block opacity-50 pointer-events-none"
  >
    Build: {{ buildInfo }}{{ isDev ? " (dev)" : "" }}
  </div>
</template>
<style scoped lang="scss"></style>
