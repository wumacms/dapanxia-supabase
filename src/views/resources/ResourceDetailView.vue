<template>
  <div class="bg-gray-50 min-h-[calc(100vh-64px)]">
    <!-- 加载状态 -->
    <div v-if="loading" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="flex flex-col items-center justify-center py-12">
        <el-icon class="loading-icon is-loading">
          <Loading />
        </el-icon>
        <p class="mt-4 text-gray-500">加载资源详情中...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-card">
        <el-icon class="empty-icon text-red-500">
          <CircleCloseFilled />
        </el-icon>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">加载失败</h3>
        <p class="text-gray-500 mb-6">{{ error }}</p>
        <el-button type="primary" @click="retryLoad" size="large">
          重试
        </el-button>
      </div>
    </div>

    <!-- 资源详情 -->
    <div v-else-if="resource" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 面包屑导航 -->
      <div class="mb-6">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ name: 'Home' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ name: 'Resources' }">资源库</el-breadcrumb-item>
          <el-breadcrumb-item>{{ resource.title }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 主要内容区域 -->
      <div class="bg-white rounded-xl shadow-card overflow-hidden">
        <!-- 头部信息 -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex flex-col lg:flex-row gap-6">
            <!-- 封面图片 -->
            <div class="lg:w-1/3">
              <div class="rounded-lg overflow-hidden shadow-md rounded-lg overflow-hidden shadow-md">
                <img
                  v-if="resource.cover_url"
                  :src="resource.cover_url"
                  :alt="resource.title"
                  class="w-full h-64 object-cover"
                />
                <div
                  v-else
                  class="w-full h-64 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100"
                >
                  <el-icon class="text-7xl text-gray-400">
                    <FolderOpened />
                  </el-icon>
                </div>
              </div>
            </div>

            <!-- 基本信息 -->
            <div class="lg:w-2/3">
              <!-- 标题和价格 -->
              <div class="flex justify-between items-start mb-4">
                <h1 class="text-2xl lg:text-3xl font-bold text-gray-900">
                  {{ resource.title }}
                </h1>
                <div class="flex items-center space-x-2">
                  <span
                    v-if="resource.is_free"
                    class="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-green-100 text-green-800"
                  >
                    免费下载
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-orange-100 text-orange-800"
                  >
                    ¥{{ resource.price }}
                  </span>
                  <el-button
                    v-if="resource.can_edit"
                    type="primary"
                    @click="editResource"
                    size="small"
                  >
                    编辑
                  </el-button>
                </div>
              </div>

              <!-- 作者信息 -->
              <div class="flex items-center mb-6">
                <div class="flex items-center">
                  <el-avatar
                    v-if="resource.author_avatar"
                    :src="resource.author_avatar"
                    :size="40"
                    class="mr-3"
                  />
                  <el-avatar
                    v-else
                    :size="40"
                    class="mr-3 bg-blue-100 text-blue-600"
                  >
                    {{ resource.author_email?.charAt(0).toUpperCase() }}
                  </el-avatar>
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {{ resource.author_email }}
                    </p>
                    <p class="text-xs text-gray-500">
                      发布于 {{ formatDate(resource.published_at || resource.created_at) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- 分类和平台标签 -->
              <div class="flex flex-wrap gap-2 mb-6">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {{ getCategoryLabel(resource.category) }}
                </span>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {{ getPlatformLabel(resource.platform) }}
                </span>
              </div>

              <!-- 统计信息 -->
              <div class="flex items-center space-x-6 text-sm text-gray-600 mb-6">
                <div class="flex items-center">
                  <el-icon class="mr-2">
                    <View />
                  </el-icon>
                  <span>{{ resource.view_count }} 次浏览</span>
                </div>
                <div class="flex items-center">
                  <el-icon class="mr-2">
                    <ShoppingCart />
                  </el-icon>
                  <span>{{ resource.purchase_count }} 次购买</span>
                </div>
                <div class="flex items-center">
                  <el-icon class="mr-2">
                    <Star />
                  </el-icon>
                  <span>0 收藏</span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex flex-wrap gap-3">
                <el-button
                  v-if="resource.can_edit"
                  type="success"
                  size="large"
                  @click="downloadResource"
                  class="flex-1 min-w-[200px]"
                >
                  <el-icon class="mr-2">
                    <Download />
                  </el-icon>
                  立即下载
                </el-button>

                <el-button
                  v-else-if="!resource.has_purchased && !resource.is_free && isAuthenticated"
                  type="primary"
                  size="large"
                  @click="handlePurchase"
                  :loading="purchasing"
                  class="flex-1 min-w-[200px]"
                >
                  <el-icon class="mr-2">
                    <ShoppingCart />
                  </el-icon>
                  立即购买 ¥{{ resource.price }}
                </el-button>

                <el-button
                  v-else-if="resource.has_purchased || resource.is_free"
                  type="success"
                  size="large"
                  @click="downloadResource"
                  class="flex-1 min-w-[200px]"
                >
                  <el-icon class="mr-2">
                    <Download />
                  </el-icon>
                  立即下载
                </el-button>

                <el-button
                  v-else
                  type="warning"
                  size="large"
                  @click="requireLogin"
                  class="flex-1 min-w-[200px]"
                >
                  <el-icon class="mr-2">
                    <User />
                  </el-icon>
                  登录后购买
                </el-button>

                <el-button size="large" @click="shareResource" class="flex-1 min-w-[120px]">
                  <el-icon class="mr-2">
                    <Share />
                  </el-icon>
                  分享
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 描述内容 -->
        <div class="p-6">
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">资源描述</h2>
            <div class="prose max-w-none">
              <div class="markdown-content" v-html="renderMarkdown(resource.description)"></div>
            </div>
          </div>

          <!-- 资源链接 -->
          <div v-if="showResourceLink" class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">资源链接</h2>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <el-icon class="text-green-500 mr-3">
                    <Link />
                  </el-icon>
                  <div>
                    <p class="text-sm font-medium text-gray-900">网盘资源地址</p>
                    <p class="text-xs text-gray-500 mt-1">{{ resource.resource_url }}</p>
                  </div>
                </div>
                <el-button
                  type="primary"
                  @click="openResourceLink"
                  size="small"
                >
                  前往下载
                </el-button>
              </div>
            </div>
          </div>

          <!-- 标签 -->
          <div v-if="resource.tags && resource.tags.length > 0" class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">相关标签</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(tag, index) in resource.tags"
                :key="index"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors"
                @click="searchByTag(tag)"
              >
                #{{ tag }}
              </span>
            </div>
          </div>

          <!-- 相似资源 -->
          <div v-if="similarResources.length > 0" class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">相似资源</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ResourceCard
                v-for="similar in similarResources"
                :key="similar.id"
                :resource="similar"
                class="h-full"
                @card-click="viewResource"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
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

// 配置 DOMPurify 保留 highlight.js 相关的 class
const dompurifyConfig = {
  ADD_TAGS: ['span'],
  ADD_ATTR: ['class']
}

// 同步渲染 Markdown
const renderMarkdown = (content: string): string => {
  // @ts-ignore - marked.parse 支持同步模式
  const html = markedInstance.parse(content || '', { async: false })
  return DOMPurify.sanitize(html, dompurifyConfig)
}
import {
  Loading,
  CircleCloseFilled,
  FolderOpened,
  View,
  ShoppingCart,
  Star,
  Download,
  User,
  Share,
  Link
} from '@element-plus/icons-vue'
import ResourceCard from '../../components/resources/ResourceCard.vue'
import { useAuthStore } from '../../stores/auth'
import { ResourceService } from '../../services/resourceService'
import { OrderService } from '../../services/orderService'
import type { Resource } from '../../types/resources'
import { ResourceCategoryLabels } from '../../types/resources'
import { CloudPlatformLabels } from '../../types/resources'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const resource = ref<Resource | null>(null)
const similarResources = ref<Resource[]>([])
const loading = ref(false)
const error = ref('')
const purchasing = ref(false)

// 计算属性
const isAuthenticated = computed(() => authStore.isAuthenticated)
const showResourceLink = computed(() => {
  if (!resource.value) return false
  return resource.value.has_purchased || resource.value.is_free || resource.value.can_edit
})

// 生命周期
onMounted(() => {
  loadResource()
})

// 监听路由参数变化，重新加载资源数据
watch(
  () => route.params.id,
  () => {
    loadResource()
  }
)

// 方法
const loadResource = async () => {
  const resourceId = route.params.id as string
  if (!resourceId) {
    error.value = '资源ID不存在'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const userId = authStore.user?.id
    resource.value = await ResourceService.getResource(resourceId, userId)

    if (resource.value) {
      loadSimilarResources()
    }
  } catch (err: any) {
    console.error('Error loading resource:', err)
    error.value = err.message || '加载资源失败'
  } finally {
    loading.value = false
  }
}

const loadSimilarResources = async () => {
  if (!resource.value) return

  try {
    const params = {
      category: resource.value.category,
      limit: 6,
      sort_by: 'purchase_count' as const,
      sort_order: 'desc' as const
    }

    const response = await ResourceService.getResources(params)
    // 过滤掉当前资源
    similarResources.value = response.data
      .filter(r => r.id !== resource.value!.id)
      .slice(0, 3)
  } catch (err) {
    console.error('Error loading similar resources:', err)
  }
}

const retryLoad = () => {
  loadResource()
}

const getCategoryLabel = (category: string) => {
  return ResourceCategoryLabels[category as keyof typeof ResourceCategoryLabels] || '其他'
}

const getPlatformLabel = (platform: string) => {
  return CloudPlatformLabels[platform as keyof typeof CloudPlatformLabels] || '其他'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handlePurchase = async () => {
  if (!isAuthenticated.value) {
    router.push({
      name: 'Login',
      query: { redirect: route.fullPath }
    })
    return
  }

  if (!resource.value) return

  const userId = authStore.user?.id
  if (!userId) return

  purchasing.value = true
  try {
    // 创建订单
    const order = await OrderService.createOrder(resource.value.id, userId)

    // 跳转到支付页面
    router.push({
      name: 'OrderDetail',
      params: { id: order.id }
    })
  } catch (err: any) {
    console.error('Error creating order:', err)
    ElMessage.error(err.message || '创建订单失败')
  } finally {
    purchasing.value = false
  }
}

const downloadResource = () => {
  if (!resource.value || !resource.value.resource_url) {
    ElMessage.warning('资源链接不存在')
    return
  }

  window.open(resource.value.resource_url, '_blank')
}

const requireLogin = () => {
  router.push({
    name: 'Login',
    query: { redirect: route.fullPath }
  })
}

const shareResource = () => {
  if (!resource.value) return

  const url = window.location.href
  navigator.clipboard.writeText(url)
    .then(() => {
      ElMessage.success('已复制分享链接到剪贴板')
    })
    .catch(() => {
      // 备选方案
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      ElMessage.success('已复制分享链接到剪贴板')
    })
}

const openResourceLink = () => {
  if (!resource.value || !resource.value.resource_url) {
    ElMessage.warning('资源链接不存在')
    return
  }

  window.open(resource.value.resource_url, '_blank')
}

const editResource = () => {
  if (!resource.value) return
  router.push(`/resources/${resource.value.id}/edit`)
}

const searchByTag = (tag: string) => {
  router.push({
    name: 'Resources',
    query: { search: tag }
  })
}

const viewResource = (resourceId: string) => {
  router.push(`/resources/${resourceId}`)
}
</script>

<style scoped>
.resource-cover {
  transition: box-shadow 300ms;
}

.resource-cover:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

/* Markdown 内容样式 - 与 MarkdownEditor 预览一致 */
.markdown-content {
  color: #374151;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-weight: 600;
  color: #111827;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

.markdown-content :deep(h1) {
  font-size: 1.75rem;
}

.markdown-content :deep(h2) {
  font-size: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.markdown-content :deep(h3) {
  font-size: 1.125rem;
}

.markdown-content :deep(h4) {
  font-size: 1rem;
}

.markdown-content :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.75;
}

.markdown-content :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.markdown-content :deep(a:hover) {
  color: #2563eb;
}

.markdown-content :deep(code) {
  background-color: #f3f4f6;
  color: #dc2626;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
}

.markdown-content :deep(pre) {
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

.markdown-content :deep(pre code) {
  background: none !important;
  color: inherit !important;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
}

/* highlight.js GitHub Light 主题 */
.markdown-content :deep(.hljs-comment),
.markdown-content :deep(.hljs-quote) {
  color: #6a737d;
  font-style: italic;
}

.markdown-content :deep(.hljs-keyword),
.markdown-content :deep(.hljs-selector-tag),
.markdown-content :deep(.hljs-literal),
.markdown-content :deep(.hljs-type),
.markdown-content :deep(.hljs-addition) {
  color: #d73a49;
}

.markdown-content :deep(.hljs-number),
.markdown-content :deep(.hljs-string),
.markdown-content :deep(.hljs-meta .hljs-meta-string),
.markdown-content :deep(.hljs-doctag),
.markdown-content :deep(.hljs-regexp) {
  color: #032f62;
}

.markdown-content :deep(.hljs-title),
.markdown-content :deep(.hljs-section),
.markdown-content :deep(.hljs-name),
.markdown-content :deep(.hljs-selector-id),
.markdown-content :deep(.hljs-selector-class) {
  color: #6f42c1;
}

.markdown-content :deep(.hljs-attribute),
.markdown-content :deep(.hljs-attr),
.markdown-content :deep(.hljs-variable),
.markdown-content :deep(.hljs-template-variable),
.markdown-content :deep(.hljs-class .hljs-title),
.markdown-content :deep(.hljs-built_in) {
  color: #005cc5;
}

.markdown-content :deep(.hljs-symbol),
.markdown-content :deep(.hljs-bullet),
.markdown-content :deep(.hljs-subst),
.markdown-content :deep(.hljs-meta),
.markdown-content :deep(.hljs-meta .hljs-keyword),
.markdown-content :deep(.hljs-selector-attr),
.markdown-content :deep(.hljs-selector-pseudo),
.markdown-content :deep(.hljs-link) {
  color: #e36209;
}

.markdown-content :deep(.hljs-deletion) {
  color: #b31d28;
  background-color: #ffeef0;
}

.markdown-content :deep(.hljs-emphasis) {
  font-style: italic;
}

.markdown-content :deep(.hljs-strong) {
  font-weight: bold;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  font-style: italic;
  color: #6b7280;
  margin-bottom: 1rem;
  background-color: #f9fafb;
  padding: 0.75rem 1rem;
  border-radius: 0 0.25rem 0.25rem 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.375rem;
  line-height: 1.6;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.markdown-content :deep(hr) {
  border: 0;
  border-top: 1px solid #e5e7eb;
  margin: 1.5rem 0;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: #f3f4f6;
  font-weight: 600;
}

.markdown-content :deep(tr:nth-child(even)) {
  background-color: #f9fafb;
}

.markdown-content :deep(del) {
  color: #9ca3af;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .resource-detail-view {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
