<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  content: string
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  className: ''
})

// 可以添加一些简单的清理逻辑或样式转换
const processedContent = computed(() => {
  return props.content || ''
})
</script>

<template>
  <div 
    class="rich-text-renderer prose max-w-none" 
    :class="className"
    v-html="processedContent"
  ></div>
</template>

<style scoped>
/* 可以在这里添加一些针对富文本内容的全局样式覆盖 */
.rich-text-renderer :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1rem 0;
}

.rich-text-renderer :deep(pre) {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
}
</style>
