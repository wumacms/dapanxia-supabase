<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

// 创建 marked 实例并配置 highlight
const markedInstance = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    }
  })
)

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  height?: string
}>(), {
  modelValue: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const showPreview = ref(false)

// 预览内容
const previewHtml = ref('')

// 配置 DOMPurify 保留 highlight.js 相关的 class
const dompurifyConfig = {
  ADD_TAGS: ['span'],
  ADD_ATTR: ['class']
}

// 切换预览
const togglePreview = () => {
  if (!showPreview.value) {
    // 使用 marked 渲染 Markdown
    // @ts-ignore - marked 支持同步模式
    const html = markedInstance.parse(props.modelValue || '', { async: false })
    previewHtml.value = DOMPurify.sanitize(html, dompurifyConfig)
  }
  showPreview.value = !showPreview.value
}

// 监听内容变化
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

// 快捷键支持
const handleKeydown = (event: KeyboardEvent) => {
  // Tab 插入空格
  if (event.key === 'Tab') {
    event.preventDefault()
    const textarea = textareaRef.value
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value
      textarea.value = value.substring(0, start) + '  ' + value.substring(end)
      textarea.selectionStart = textarea.selectionEnd = start + 2
      emit('update:modelValue', textarea.value)
    }
  }
}

// 插入 Markdown 语法
const insertMarkdown = (before: string, after: string = '') => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const selectedText = text.substring(start, end)

  const newText = text.substring(0, start) + before + selectedText + after + text.substring(end)

  textarea.value = newText
  textarea.focus()

  // 设置光标位置
  if (selectedText) {
    textarea.selectionStart = start + before.length
    textarea.selectionEnd = start + before.length + selectedText.length
  } else {
    textarea.selectionStart = textarea.selectionEnd = start + before.length
  }

  emit('update:modelValue', textarea.value)
}

// 快捷工具
const toolbarActions = [
  { label: 'B', title: '粗体', before: '**', after: '**' },
  { label: 'I', title: '斜体', before: '*', after: '*' },
  { label: 'S', title: '删除线', before: '~~', after: '~~' },
  { label: 'H1', title: '一级标题', before: '# ', after: '' },
  { label: 'H2', title: '二级标题', before: '## ', after: '' },
  { label: 'H3', title: '三级标题', before: '### ', after: '' },
  { label: '🔗', title: '链接', before: '[', after: '](url)' },
  { label: '📷', title: '图片', before: '![alt](', after: ')' },
  { label: '❝', title: '引用', before: '> ', after: '' },
  { label: '•', title: '无序列表', before: '- ', after: '' },
  { label: '1.', title: '有序列表', before: '1. ', after: '' },
  { label: '```', title: '代码块', before: '```\n', after: '\n```' },
]

onMounted(() => {
  // 聚焦到编辑器
  textareaRef.value?.focus()
})
</script>

<template>
  <div class="markdown-editor-wrapper w-full">
    <!-- 工具栏 -->
    <div class="editor-toolbar border border-gray-200 rounded-t-lg bg-gray-50 px-3 py-2 flex items-center justify-between">
      <div class="flex items-center space-x-1 overflow-x-auto">
        <el-tooltip
          v-for="action in toolbarActions"
          :key="action.label"
          :content="action.title"
          placement="bottom"
        >
          <button
            type="button"
            class="px-2 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors min-w-[28px]"
            @click="insertMarkdown(action.before, action.after)"
          >
            {{ action.label }}
          </button>
        </el-tooltip>
      </div>
      <div class="flex items-center space-x-2 ml-2">
        <el-button
          size="small"
          :type="showPreview ? 'primary' : 'default'"
          @click="togglePreview"
        >
          {{ showPreview ? '返回编辑' : '预览' }}
        </el-button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div
      class="editor-container border border-t-0 border-gray-200 rounded-b-lg bg-white overflow-hidden"
      :style="{ height: height || '400px' }"
    >
      <!-- 编辑模式 - Markdown 源码 -->
      <div v-show="!showPreview" class="h-full overflow-auto">
        <textarea
          ref="textareaRef"
          :value="modelValue"
          :placeholder="placeholder || '在此输入 Markdown 内容...\n\n支持以下语法：\n- 标题 (# ## ###)\n- 粗体 (**文字**)\n- 斜体 (*文字*)\n- 链接 [文字](url)\n- 图片 ![alt](url)\n- 代码块 (```)\n- 引用 (> )'"
          class="markdown-textarea w-full h-full resize-none border-0 focus:outline-none focus:ring-0 p-4 font-mono text-sm leading-relaxed"
          :style="{ minHeight: height || '400px' }"
          @input="handleInput"
          @keydown="handleKeydown"
        ></textarea>
      </div>

      <!-- 预览模式 - HTML 渲染 -->
      <div
        v-show="showPreview"
        class="h-full overflow-auto p-6 bg-white"
      >
        <div
          v-if="modelValue"
          class="markdown-preview prose prose-sm max-w-none mx-auto"
          v-html="previewHtml"
        ></div>
        <div v-else class="text-gray-400 text-center mt-16">
          暂无内容预览
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 全宽容器 */
.markdown-editor-wrapper {
  width: 100%;
}

/* 编辑器主体 */
.editor-container {
  width: 100%;
}

/* Markdown 文本编辑区 */
.markdown-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  background-color: #fafafa;
  line-height: 1.7;
}

.markdown-textarea::placeholder {
  color: #9ca3af;
  line-height: 1.8;
}

/* 预览区域样式 */
.markdown-preview {
  color: #374151;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  font-weight: 600;
  color: #111827;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

.markdown-preview :deep(h1) {
  font-size: 1.75rem;
}

.markdown-preview :deep(h2) {
  font-size: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.markdown-preview :deep(h3) {
  font-size: 1.125rem;
}

.markdown-preview :deep(h4) {
  font-size: 1rem;
}

.markdown-preview :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.75;
}

.markdown-preview :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.markdown-preview :deep(a:hover) {
  color: #2563eb;
}

.markdown-preview :deep(code) {
  background-color: #f3f4f6;
  color: #dc2626;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.markdown-preview :deep(pre) {
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

.markdown-preview :deep(pre code) {
  background: none !important;
  color: inherit !important;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
}

/* highlight.js GitHub Light 主题 - 使用 :deep() 确保应用到 v-html */
.markdown-preview :deep(.hljs-comment),
.markdown-preview :deep(.hljs-quote) {
  color: #6a737d;
  font-style: italic;
}

.markdown-preview :deep(.hljs-keyword),
.markdown-preview :deep(.hljs-selector-tag),
.markdown-preview :deep(.hljs-literal),
.markdown-preview :deep(.hljs-type),
.markdown-preview :deep(.hljs-addition) {
  color: #d73a49;
}

.markdown-preview :deep(.hljs-number),
.markdown-preview :deep(.hljs-string),
.markdown-preview :deep(.hljs-meta .hljs-meta-string),
.markdown-preview :deep(.hljs-doctag),
.markdown-preview :deep(.hljs-regexp) {
  color: #032f62;
}

.markdown-preview :deep(.hljs-title),
.markdown-preview :deep(.hljs-section),
.markdown-preview :deep(.hljs-name),
.markdown-preview :deep(.hljs-selector-id),
.markdown-preview :deep(.hljs-selector-class) {
  color: #6f42c1;
}

.markdown-preview :deep(.hljs-attribute),
.markdown-preview :deep(.hljs-attr),
.markdown-preview :deep(.hljs-variable),
.markdown-preview :deep(.hljs-template-variable),
.markdown-preview :deep(.hljs-class .hljs-title),
.markdown-preview :deep(.hljs-built_in) {
  color: #005cc5;
}

.markdown-preview :deep(.hljs-symbol),
.markdown-preview :deep(.hljs-bullet),
.markdown-preview :deep(.hljs-subst),
.markdown-preview :deep(.hljs-meta),
.markdown-preview :deep(.hljs-meta .hljs-keyword),
.markdown-preview :deep(.hljs-selector-attr),
.markdown-preview :deep(.hljs-selector-pseudo),
.markdown-preview :deep(.hljs-link) {
  color: #e36209;
}

.markdown-preview :deep(.hljs-deletion) {
  color: #b31d28;
  background-color: #ffeef0;
}

.markdown-preview :deep(.hljs-emphasis) {
  font-style: italic;
}

.markdown-preview :deep(.hljs-strong) {
  font-weight: bold;
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  font-style: italic;
  color: #6b7280;
  margin-bottom: 1rem;
  background-color: #f9fafb;
  padding: 0.75rem 1rem;
  border-radius: 0 0.25rem 0.25rem 0;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.markdown-preview :deep(li) {
  margin-bottom: 0.375rem;
  line-height: 1.6;
}

.markdown-preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.markdown-preview :deep(hr) {
  border: 0;
  border-top: 1px solid #e5e7eb;
  margin: 1.5rem 0;
}

.markdown-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  text-align: left;
}

.markdown-preview :deep(th) {
  background-color: #f3f4f6;
  font-weight: 600;
}

.markdown-preview :deep(tr:nth-child(even)) {
  background-color: #f9fafb;
}

.markdown-preview :deep(del) {
  color: #9ca3af;
}

/* 工具栏按钮 */
.editor-toolbar button {
  white-space: nowrap;
}
</style>
