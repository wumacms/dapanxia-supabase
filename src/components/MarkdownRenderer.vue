<template>
  <div class="markdown-content" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const props = defineProps<{
  content: string
}>()

const renderedHtml = ref('')

// 动态导入重型库
const loadMarkdownLibraries = async () => {
  const [
    { Marked },
    { markedHighlight },
    { default: hljs },
    { default: DOMPurify }
  ] = await Promise.all([
    import('marked'),
    import('marked-highlight'),
    import('highlight.js'),
    import('dompurify')
  ])

  const markedInstance = new Marked(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code: string, lang: string) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext'
        return hljs.highlight(code, { language }).value
      }
    })
  )

  const dompurifyConfig = {
    ADD_TAGS: ['span'],
    ADD_ATTR: ['class']
  }

  return { markedInstance, DOMPurify, dompurifyConfig }
}

let markdownTools: any = null

watchEffect(async () => {
  if (!props.content) {
    renderedHtml.value = ''
    return
  }

  if (!markdownTools) {
    markdownTools = await loadMarkdownLibraries()
  }

  const { markedInstance, DOMPurify, dompurifyConfig } = markdownTools
  const html = await markedInstance.parse(props.content)
  renderedHtml.value = DOMPurify.sanitize(html, dompurifyConfig)
})
</script>

<style scoped>
/* 保持原有的 Markdown 样式 */
.markdown-content {
  color: #374151;
}

:deep(h1),
:deep(h2),
:deep(h3),
:deep(h4),
:deep(h5),
:deep(h6) {
  font-weight: 600;
  color: #111827;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

:deep(h1) { font-size: 1.75rem; }
:deep(h2) { font-size: 1.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb; }
:deep(h3) { font-size: 1.125rem; }
:deep(h4) { font-size: 1rem; }

:deep(p) { margin-bottom: 1rem; line-height: 1.75; }
:deep(a) { color: #3b82f6; text-decoration: underline; }
:deep(a:hover) { color: #2563eb; }

:deep(code) {
  background-color: #f3f4f6;
  color: #dc2626;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
}

:deep(pre) {
  background-color: #f6f8fa;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  border: 1px solid #e1e4e8;
}

:deep(pre code) {
  background: none !important;
  color: inherit !important;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
}

/* 引用 highlight.js 样式 */
:deep(.hljs-comment) { color: #6a737d; font-style: italic; }
:deep(.hljs-keyword) { color: #d73a49; }
:deep(.hljs-number), :deep(.hljs-string) { color: #032f62; }
:deep(.hljs-title) { color: #6f42c1; }
/* ... 其他样式由主应用或全局提供 ... */

:deep(blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  font-style: italic;
  color: #6b7280;
  margin-bottom: 1rem;
  background-color: #f9fafb;
  padding: 0.75rem 1rem;
  border-radius: 0 0.25rem 0.25rem 0;
}

:deep(ul), :deep(ol) { padding-left: 1.5rem; margin-bottom: 1rem; }
:deep(li) { margin-bottom: 0.375rem; line-height: 1.6; }
:deep(img) { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; }
:deep(table) { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
:deep(th), :deep(td) { border: 1px solid #d1d5db; padding: 0.5rem 1rem; }
:deep(th) { background-color: #f3f4f6; }
</style>
