<template>
  <div class="resource-detail-view">
    <!-- 加载状态 -->
    <div v-if="loading" class="container mx-auto px-4 py-12">
      <div class="text-center">
        <el-icon class="is-loading text-4xl text-blue-500">
          <Loading />
        </el-icon>
        <p class="mt-4 text-gray-600">加载资源详情中...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="container mx-auto px-4 py-12">
      <div class="text-center">
        <el-icon class="text-6xl text-red-500 mb-4">
          <CircleCloseFilled />
        </el-icon>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">加载失败</h3>
        <p class="text-gray-600 mb-6">{{ error }}</p>
        <el-button type="primary" @click="retryLoad" size="large">
          重试
        </el-button>
      </div>
    </div>

    <!-- 资源详情 -->
    <div v-else-if="resource" class="max-w-6xl mx-auto px-4 py-8">
      <!-- 面包屑导航 -->
      <div class="mb-6">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ name: 'Resources' }">
            资源列表
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ resource.title }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 主要内容区域 -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <!-- 头部信息 -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex flex-col lg:flex-row gap-6">
            <!-- 封面图片 -->
            <div class="lg:w-1/3">
              <div class="resource-cover rounded-lg overflow-hidden shadow-md">
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
                  v-if="!resource.has_purchased && !resource.is_free && isAuthenticated"
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
                @click="viewResource(similar.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
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

const renderMarkdown = (content: string) => {
  const rawHtml = marked.parse(content, { async: false }) as string
  return DOMPurify.sanitize(rawHtml)
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
.resource-detail-view {
  min-height: calc(100vh - 64px);
  background-color: #f8fafc;
}

.resource-cover {
  transition: box-shadow 300ms;
}

.resource-cover:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

.markdown-content {
  color: #374151;
  line-height: 1.625;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4 {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.75rem;
}

.markdown-content h1 {
  font-size: 1.5rem;
  line-height: 2rem;
}

.markdown-content h2 {
  font-size: 1.25rem;
  line-height: 1.75rem;
}

.markdown-content h3 {
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.markdown-content p {
  margin-bottom: 1rem;
}

.markdown-content ul,
.markdown-content ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.markdown-content li {
  margin-bottom: 0.25rem;
}

.markdown-content code {
  background-color: #f3f4f6;
  color: #1f2937;
  padding: 0.1rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.markdown-content pre {
  background-color: #111827;
  color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.markdown-content blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  font-style: italic;
  color: #4b5563;
  margin-bottom: 1rem;
}

.markdown-content a {
  color: #2563eb;
  text-decoration: underline;
}

.markdown-content a:hover {
  color: #1e40af;
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
}

.markdown-content th {
  background-color: #f3f4f6;
  font-weight: 600;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .resource-detail-view {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>