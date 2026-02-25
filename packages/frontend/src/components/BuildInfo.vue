<script setup lang="ts">
const buildInfo = import.meta.env.VITE_COMMIT;
const isDev = import.meta.env.DEV;
</script>
<template>
  <div
    un-absolute
    un-left="[calc(var(--sail)_+_1rem)]"
    un-bottom="[calc(var(--saib)_+_1rem)]"
    un-hidden
    un-opacity="50"
    un-pointer-events="none"
    un-xs="block"
  >
    Build: {{ buildInfo }}{{ isDev ? " (dev)" : "" }}
  </div>
</template>
<style scoped lang="scss"></style>
