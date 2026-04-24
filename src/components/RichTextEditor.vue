<script setup lang="ts">
import { ref, watch } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import { ResourceService } from '../services/resourceService'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: string
  placeholder?: string
  height?: string | number
  disabled?: boolean
  plugins?: string | string[]
  toolbar?: string | string[] | boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入内容...',
  height: 400,
  disabled: false,
  plugins: () => [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount'
  ],
  toolbar: () => 'undo redo | blocks | ' +
    'bold italic forecolor | alignleft aligncenter ' +
    'alignright alignjustify | bullist numlist outdent indent | ' +
    'removeformat | image link | help'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
}>()

const authStore = useAuthStore()
const content = ref(props.modelValue)

// 监听外部 modelValue 变化
watch(() => props.modelValue, (val) => {
  content.value = val
})

// 监听内部 content 变化并同步到外部
watch(content, (val) => {
  emit('update:modelValue', val)
  emit('change', val)
})

// TinyMCE 初始化配置
const initOptions = {
  language: 'zh_CN',
  height: props.height,
  menubar: false,
  placeholder: props.placeholder,
  plugins: props.plugins,
  toolbar: props.toolbar,
  branding: false,
  promotion: false,
  statusbar: true,
  elementpath: false,
  license_key: 'gpl', // TinyMCE 7+ GPL 模式
  
  // 图片上传处理
  images_upload_handler: async (blobInfo: any) => {
    try {
      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('用户未登录')
      }

      const file = blobInfo.blob()
      // 这里调用 ResourceService 的上传逻辑
      const imageUrl = await ResourceService.uploadContentImage(file, userId)
      return imageUrl
    } catch (error: any) {
      ElMessage.error('图片上传失败: ' + (error.message || '未知错误'))
      throw error
    }
  },
  
  // 内容样式
  content_style: `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; }
    img { max-width: 100%; height: auto; border-radius: 4px; }
  `
}
</script>

<template>
  <div class="rich-text-editor">
    <Editor
      v-model="content"
      :init="initOptions"
      :disabled="disabled"
      license-key="gpl"
      tinymce-script-src="/tinymce/tinymce.min.js"
    />
  </div>
</template>

<style scoped>
.rich-text-editor :deep(.tox-tinymce) {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
</style>
