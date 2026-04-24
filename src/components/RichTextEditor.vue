<script setup lang="ts">
import { ref, watch } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import { ResourceService } from '../services/resourceService'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { getErrorMessage } from '../utils/i18n'
import { formatFileSize } from '../utils/format'

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
    'removeformat | image multiimage link | help'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
}>()

const authStore = useAuthStore()
const content = ref(props.modelValue)
const totalUploadedSize = ref(0)

// 监听外部 modelValue 变化
watch(() => props.modelValue, (val) => {
  content.value = val
})

// 监听内部 content 变化并同步到外部
watch(content, (val) => {
  emit('update:modelValue', val)
  emit('change', val)
})

// 图片上传处理函数
const handleImageUpload = async (file: File) => {
  const userId = authStore.user?.id
  if (!userId) {
    throw new Error('用户未登录')
  }

  // 验证单张图片大小
  const maxSizeKB = Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_KB) || 5120
  if (file.size > maxSizeKB * 1024) {
    throw new Error(`单张图片大小不能超过 ${formatFileSize(maxSizeKB * 1024)}`)
  }

  // 验证总上传大小
  const maxTotalSizeKB = Number(import.meta.env.VITE_MAX_TOTAL_IMAGE_SIZE_KB) || 2048
  if (totalUploadedSize.value + file.size > maxTotalSizeKB * 1024) {
    throw new Error(`本条资源图片总大小已超过限制 (${formatFileSize(maxTotalSizeKB * 1024)})`)
  }

  const imageUrl = await ResourceService.uploadContentImage(file, userId)
  totalUploadedSize.value += file.size
  return imageUrl
}

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
      return await handleImageUpload(blobInfo.blob())
    } catch (error: any) {
      ElMessage.error('图片上传失败: ' + getErrorMessage(error))
      throw error
    }
  },

  // 自定义按钮
  setup: (editor: any) => {
    // 注册批量上传按钮
    editor.ui.registry.addButton('multiimage', {
      icon: 'gallery',
      tooltip: '批量上传图片',
      onAction: () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.multiple = true
        input.onchange = async () => {
          const files = Array.from(input.files || [])
          if (files.length === 0) return

          // 显示加载提示
          const loadingMsg = ElMessage({
            message: `正在上传 ${files.length} 张图片...`,
            type: 'info',
            duration: 0
          })

          let successCount = 0
          let failCount = 0

          for (const file of files) {
            try {
              const url = await handleImageUpload(file)
              editor.insertContent(`<p><img src="${url}" alt="${file.name}" /></p>`)
              successCount++
            } catch (error: any) {
              console.error(`Failed to upload ${file.name}:`, error)
              failCount++
            }
          }

          loadingMsg.close()
          
          if (successCount > 0) {
            ElMessage.success(`成功上传 ${successCount} 张图片`)
          }
          if (failCount > 0) {
            ElMessage.error(`${failCount} 张图片上传失败`)
          }
        }
        input.click()
      }
    })
  },
  
  // 内容样式
  content_style: `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; }
    img { max-width: 100%; height: auto; border-radius: 4px; display: block; margin: 10px 0; }
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
