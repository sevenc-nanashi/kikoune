<script setup lang="ts">
const buildInfo = import.meta.env.VITE_COMMIT
</script>
<template>
  <div
    class="absolute left-3 bottom-3 hidden sm:block opacity-50 pointer-events-none"
  >
    Build: {{ buildInfo }}
  </div>
</template>
<style scoped lang="scss"></style>
