<script setup lang="ts">
import { Marked, Parser, Renderer } from "marked"

const props = defineProps<{
  source: string
}>()

const marked = new Marked()
const originalRenderer = new Renderer()
originalRenderer.parser = new Parser()

marked.use({
  breaks: true,
  renderer: {
    // budouxを適用する
    text(token) {
      const html = originalRenderer.text(token)
      return `<budoux-ja>${html}</budoux-ja>`
    },

    // リンクを新しいタブで開く
    link({ href, text }) {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
    },

    // BASE_URLからの相対パスを絶対パスに変換
    image({ href, text }) {
      if (href.startsWith("/")) {
        return `<img src="${import.meta.env.BASE_URL}${href}" alt="${text}" />`
      }
      return `<img src="${href}" alt="${text}" />`
    },
  },
})

const html = marked.parse(props.source) as string
</script>
<template>
  <!-- eslint-disable-next-line vue/no-v-html-->
  <div class="markdown" v-html="html" />
</template>
<style lang="scss">
@use "~/style.scss";

.markdown {
  li {
    list-style-type: disc;
    @apply ml-4;
    &::marker {
      color: theme("colors.cyan.500");
    }
  }
  blockquote {
    @apply my-1 pl-2 border-l-2 border-slate-500 text-slate-700;
  }
  p {
    @apply my-2;
  }
  strong {
    @apply text-cyan-500;
  }
  a {
    @apply hover:text-cyan-500 underline;
  }
}
</style>
