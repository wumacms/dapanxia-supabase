<template>
  <div class="bg-gray-50 min-h-[calc(100vh-64px)]">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 面包屑导航 -->
      <div class="mb-6">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ name: 'Home' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ name: 'Resources' }">资源库</el-breadcrumb-item>
          <el-breadcrumb-item>发布新资源</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">发布新资源</h1>
        <p class="mt-2 text-gray-500">填写资源信息，发布到网盘资源库供其他用户下载</p>
      </div>

      <!-- 表单内容 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent="submitForm"
      >
        <div class="bg-white rounded-xl p-6 shadow-card">
          <!-- 基本信息 -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">基本信息</h2>

            <!-- 资源标题 -->
            <el-form-item label="资源标题" prop="title" class="mb-6">
              <el-input
                v-model="form.title"
                placeholder="请输入资源标题（最多100字）"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <!-- 封面图片 -->
            <el-form-item label="封面图片" prop="cover_url" class="mb-6">
              <div class="flex items-start space-x-4">
                <!-- 图片预览 -->
                <div
                  v-if="form.cover_url"
                  class="relative w-48 h-48 rounded-lg overflow-hidden border border-gray-200"
                >
                  <img
                    :src="form.cover_url"
                    alt="封面预览"
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute top-2 right-2">
                    <el-button
                      type="danger"
                      size="small"
                      circle
                      @click="removeCoverImage"
                    >
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                </div>

                <!-- 上传区域 -->
                <div
                  v-else
                  class="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all"
                  @click="triggerFileInput"
                >
                  <el-icon class="text-3xl text-gray-400 mb-2">
                    <Upload />
                  </el-icon>
                  <p class="text-sm text-gray-500">点击上传封面</p>
                  <p class="text-xs text-gray-400 mt-1">建议尺寸：800x600px</p>
                </div>

                <!-- 上传按钮 -->
                <div class="flex flex-col space-y-2">
                  <el-button
                    type="primary"
                    @click="triggerFileInput"
                    :loading="uploading"
                  >
                    <el-icon class="mr-2">
                      <Upload />
                    </el-icon>
                    选择图片
                  </el-button>
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleFileUpload"
                  />
                  <p class="text-sm text-gray-500">
                    支持 JPG、PNG 格式，大小不超过 5MB
                  </p>
                </div>
              </div>
            </el-form-item>
          </div>

          <!-- 资源信息 -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">资源信息</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- 资源分类 -->
              <el-form-item label="资源分类" prop="category">
                <el-select
                  v-model="form.category"
                  placeholder="请选择资源分类"
                  class="w-full"
                >
                  <el-option
                    v-for="category in categories"
                    :key="category.value"
                    :label="category.label"
                    :value="category.value"
                  />
                </el-select>
              </el-form-item>

              <!-- 网盘平台 -->
              <el-form-item label="网盘平台" prop="platform">
                <el-select
                  v-model="form.platform"
                  placeholder="请选择网盘平台"
                  class="w-full"
                >
                  <el-option
                    v-for="platform in platforms"
                    :key="platform.value"
                    :label="platform.label"
                    :value="platform.value"
                  />
                </el-select>
              </el-form-item>
            </div>

            <!-- 资源链接 -->
            <el-form-item label="资源链接" prop="resource_url" class="mb-6">
              <el-input
                v-model="form.resource_url"
                placeholder="请输入网盘资源链接（如：https://pan.baidu.com/s/...）"
                type="url"
              />
              <template #label>
                <div class="flex items-center">
                  <span>资源链接</span>
                  <el-tooltip
                    content="付费资源链接将被隐藏，只有购买者可见"
                    placement="top"
                  >
                    <el-icon class="ml-2 text-gray-400">
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-form-item>

            <!-- 价格设置 -->
            <el-form-item label="价格设置" class="mb-6">
              <div class="flex items-center space-x-4">
                <el-switch
                  v-model="form.is_free"
                  :active-text="form.is_free ? '免费资源' : '付费资源'"
                  @change="handleFreeToggle"
                />
                <el-input
                  v-if="!form.is_free"
                  v-model="form.price"
                  type="number"
                  placeholder="请输入价格"
                  :min="0.01"
                  :step="0.01"
                  style="width: 150px"
                >
                  <template #append>元</template>
                </el-input>
              </div>
            </el-form-item>
          </div>

          <!-- 描述和标签 -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">描述和标签</h2>

            <!-- 资源描述 -->
            <el-form-item label="资源描述" prop="description" class="mb-6">
              <div class="w-full">
                <div class="mb-2 border-b border-gray-200">
                  <div class="flex space-x-2">
                    <el-button
                      v-for="button in markdownButtons"
                      :key="button.action"
                      link
                      size="small"
                      @click="insertMarkdown(button.action)"
                    >
                      <el-icon>
                        <component :is="button.icon" />
                      </el-icon>
                    </el-button>
                  </div>
                </div>
                <el-input
                  v-model="form.description"
                  type="textarea"
                  :rows="8"
                  placeholder="请详细描述资源内容，支持Markdown语法..."
                  resize="none"
                />
                <div class="mt-2 text-xs text-gray-500">
                  <span>支持Markdown语法</span>
                  <el-link
                    href="https://www.markdownguide.org/basic-syntax/"
                    target="_blank"
                    class="ml-2"
                  >
                    查看Markdown指南
                  </el-link>
                </div>
              </div>
            </el-form-item>

            <!-- 标签 -->
            <el-form-item label="资源标签" prop="tags" class="mb-6">
              <el-select
                v-model="form.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="输入标签，按回车确认"
                class="w-full"
              >
                <el-option
                  v-for="tag in popularTags"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
              <template #label>
                <div class="flex items-center">
                  <span>资源标签</span>
                  <el-tooltip
                    content="添加相关标签，方便用户搜索"
                    placement="top"
                  >
                    <el-icon class="ml-2 text-gray-400">
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-form-item>
          </div>

          <!-- 发布设置 -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">发布设置</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- 发布状态 -->
              <el-form-item label="发布状态" prop="status">
                <el-select
                  v-model="form.status"
                  placeholder="请选择发布状态"
                  class="w-full"
                >
                  <el-option label="草稿" value="draft" />
                  <el-option label="立即发布" value="published" />
                </el-select>
              </el-form-item>

              <!-- 显示状态 -->
              <el-form-item label="显示状态" prop="is_visible">
                <el-switch
                  v-model="form.is_visible"
                  :active-text="form.is_visible ? '显示' : '隐藏'"
                />
              </el-form-item>
            </div>
          </div>

          <!-- 表单操作 -->
          <div class="flex justify-between pt-6 border-t border-gray-200">
            <el-button @click="cancel" size="large">
              取消
            </el-button>
            <div class="space-x-4">
              <el-button
                type="info"
                size="large"
                @click="saveAsDraft"
                :loading="submitting"
              >
                保存为草稿
              </el-button>
              <el-button
                type="primary"
                size="large"
                @click="submitForm"
                :loading="submitting"
              >
                立即发布
              </el-button>
            </div>
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Upload,
  Close,
  InfoFilled,
  EditPen,
  Tickets,
  List,
  Link,
  ChatLineSquare,
  Operation
} from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { ResourceService } from '../../services/resourceService'
import { CreateResourceRequest, ResourceCategory, CloudPlatform, ResourceStatus } from '../../types/resources'
import { ResourceCategoryLabels, CloudPlatformLabels } from '../../types/resources'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const fileInputRef = ref<HTMLInputElement>()

// 响应式数据
const form = reactive<CreateResourceRequest & { tags: string[] }>({
  title: '',
  description: '',
  cover_url: '',
  resource_url: '',
  category: ResourceCategory.OTHER,
  platform: CloudPlatform.OTHER,
  price: 0,
  is_free: true,
  status: ResourceStatus.DRAFT,
  is_visible: true,
  tags: []
})

const categories = Object.entries(ResourceCategoryLabels).map(([value, label]) => ({
  label,
  value: value as ResourceCategory
}))

const platforms = Object.entries(CloudPlatformLabels).map(([value, label]) => ({
  label,
  value: value as CloudPlatform
}))

const popularTags = [
  '软件', '游戏', '学习', '教程', '资料',
  '模板', '工具', '插件', '素材', '音乐',
  '视频', '图片', '文档', '电子书', '代码'
]

const markdownButtons = [
  { icon: EditPen, action: 'bold' },
  { icon: Tickets, action: 'italic' },
  { icon: List, action: 'list' },
  { icon: Link, action: 'link' },
  { icon: ChatLineSquare, action: 'quote' },
  { icon: Operation, action: 'code' }
]

const uploading = ref(false)
const submitting = ref(false)

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入资源标题', trigger: 'blur' },
    { min: 3, max: 100, message: '标题长度在 3 到 100 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入资源描述', trigger: 'blur' },
    { min: 10, message: '描述至少需要 10 个字符', trigger: 'blur' }
  ],
  resource_url: [
    { required: true, message: '请输入资源链接', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL链接', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择资源分类', trigger: 'change' }
  ],
  platform: [
    { required: true, message: '请选择网盘平台', trigger: 'change' }
  ],
  price: [
    {
      validator: (_, value, callback) => {
        if (!form.is_free && (!value || value <= 0)) {
          callback(new Error('付费资源的价格必须大于0元'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 方法
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 验证文件类型和大小
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!validTypes.includes(file.type)) {
    ElMessage.error('只支持 JPG、PNG、WebP 格式的图片')
    return
  }

  if (file.size > maxSize) {
    ElMessage.error('图片大小不能超过 5MB')
    return
  }

  uploading.value = true
  try {
    const userId = authStore.user?.id
    if (!userId) {
      throw new Error('用户未登录')
    }

    const imageUrl = await ResourceService.uploadCoverImage(file, userId)
    form.cover_url = imageUrl
    ElMessage.success('图片上传成功')
  } catch (error: any) {
    console.error('Error uploading image:', error)
    ElMessage.error(error.message || '图片上传失败')
  } finally {
    uploading.value = false
    // 清空文件输入
    if (target) target.value = ''
  }
}

const removeCoverImage = () => {
  form.cover_url = ''
}

const handleFreeToggle = (isFree: boolean) => {
  if (!isFree) {
    form.price = 0.01
  } else {
    form.price = 0
  }
}

const insertMarkdown = (action: string) => {
  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = form.description.substring(start, end)
  let insertText = ''

  switch (action) {
    case 'bold':
      insertText = `**${selectedText || '加粗文本'}**`
      break
    case 'italic':
      insertText = `*${selectedText || '斜体文本'}*`
      break
    case 'list':
      insertText = `\n- ${selectedText || '列表项'}`
      break
    case 'link':
      insertText = `[${selectedText || '链接文本'}](https://example.com)`
      break
    case 'quote':
      insertText = `\n> ${selectedText || '引用文本'}`
      break
    case 'code':
      insertText = `\`\`\`\n${selectedText || '代码块'}\n\`\`\``
      break
  }

  form.description =
    form.description.substring(0, start) +
    insertText +
    form.description.substring(end)

  // 聚焦到textarea并设置光标位置
  setTimeout(() => {
    textarea.focus()
    const newCursorPos = start + insertText.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  }, 0)
}

const saveAsDraft = async () => {
  form.status = ResourceStatus.DRAFT
  await submitForm()
}

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('用户未登录')
      }

      const requestData: CreateResourceRequest = {
        title: form.title,
        description: form.description,
        cover_url: form.cover_url,
        resource_url: form.resource_url,
        category: form.category,
        platform: form.platform,
        price: form.price,
        is_free: form.is_free,
        status: form.status,
        is_visible: form.is_visible,
        tags: form.tags
      }

      const resource = await ResourceService.createResource(requestData, userId)

      ElMessage.success(form.status === ResourceStatus.PUBLISHED ? '资源发布成功' : '草稿保存成功')

      // 跳转到资源详情页
      router.push({
        name: 'ResourceDetail',
        params: { id: resource.id }
      })
    } catch (error: any) {
      console.error('Error creating resource:', error)
      ElMessage.error(error.message || (form.status === ResourceStatus.PUBLISHED ? '发布失败' : '保存失败'))
    } finally {
      submitting.value = false
    }
  })
}

const cancel = () => {
  router.back()
}

// 生命周期
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push({
      name: 'Login',
      query: { redirect: router.currentRoute.value.fullPath }
    })
  }
})
</script>

<style scoped>
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

:deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-switch__label) {
  font-weight: 500;
}
</style>
