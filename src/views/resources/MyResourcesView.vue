<template>
  <div class="bg-gray-50 min-h-[calc(100vh-64px)]">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 面包屑导航 -->
      <div class="mb-6">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ name: 'Home' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ name: 'Resources' }">资源库</el-breadcrumb-item>
          <el-breadcrumb-item>我的资源</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">我的资源</h1>
        <p class="mt-2 text-gray-500">管理您发布的网盘资源，包括草稿和已发布资源</p>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="总资源数"
          :value="stats.total_resources || 0"
          :icon="Folder"
          type="blue"
        />
        <StatCard
          title="已发布"
          :value="stats.published_resources || 0"
          :icon="Check"
          type="green"
        />
        <StatCard
          title="草稿"
          :value="stats.draft_resources || 0"
          :icon="Edit"
          type="yellow"
        />
        <StatCard
          title="总收入"
          :value="`¥${stats.total_revenue?.toFixed(2) || '0.00'}`"
          :icon="Money"
          type="purple"
        />
      </div>

      <!-- 筛选和操作栏 -->
      <div class="bg-white rounded-xl p-6 shadow-card mb-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- 状态筛选 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">资源状态</label>
            <el-select
              v-model="filterStatus"
              placeholder="所有状态"
              size="large"
              class="w-full"
              @change="loadResources"
            >
              <el-option label="所有状态" value="all" />
              <el-option label="已发布" value="published" />
              <el-option label="草稿" value="draft" />
            </el-select>
          </div>

          <!-- 价格筛选 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">价格筛选</label>
            <el-select
              v-model="filterPrice"
              placeholder="价格筛选"
              size="large"
              class="w-full"
              @change="loadResources"
            >
              <el-option label="所有价格" value="all" />
              <el-option label="免费" value="free" />
              <el-option label="付费" value="paid" />
            </el-select>
          </div>

          <!-- 排序 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
            <el-select
              v-model="sortBy"
              size="large"
              class="w-full"
              @change="loadResources"
            >
              <el-option label="最新发布" value="newest" />
              <el-option label="最早发布" value="oldest" />
              <el-option label="价格最高" value="price_high" />
              <el-option label="价格最低" value="price_low" />
              <el-option label="购买最多" value="purchases" />
              <el-option label="浏览最多" value="views" />
            </el-select>
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-end space-x-2">
            <el-button
              type="primary"
              size="large"
              @click="navigateToCreate"
            >
              <el-icon class="mr-2">
                <Plus />
              </el-icon>
              发布新资源
            </el-button>
            <el-button
              size="large"
              @click="refreshData"
              :loading="loading"
            >
              <el-icon class="mr-2">
                <Refresh />
              </el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading && resources.length === 0" class="flex flex-col items-center justify-center py-12">
        <el-icon class="text-4xl text-blue-500 is-loading">
          <Loading />
        </el-icon>
        <p class="mt-4 text-gray-500">加载资源中...</p>
      </div>

      <!-- 空状态 -->
      <EmptyState
        v-else-if="resources.length === 0"
        type="data"
        title="暂无资源"
        description="您还没有发布任何资源，现在就去发布一个吧"
        show-action
        action-text="发布新资源"
        @action="navigateToCreate"
        class="bg-white rounded-xl shadow-card"
      />

      <!-- 资源表格 -->
      <div v-else class="bg-white rounded-xl shadow-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  资源
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  价格
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  可见性
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  统计
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="resource in resources"
                :key="resource.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <!-- 资源信息 -->
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-12 w-12 mr-4">
                      <img
                        v-if="resource.cover_url"
                        :src="resource.cover_url"
                        :alt="resource.title"
                        loading="lazy"
                        class="h-12 w-12 rounded object-cover"
                      />
                      <div
                        v-else
                        class="h-12 w-12 rounded bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center"
                      >
                        <el-icon class="text-gray-400">
                          <Folder />
                        </el-icon>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {{ resource.title }}
                      </p>
                      <div class="flex items-center mt-1 space-x-2">
                        <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                          {{ getCategoryLabel(resource.category) }}
                        </span>
                        <span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                          {{ getPlatformLabel(resource.platform) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- 价格 -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium">
                    <span v-if="resource.is_free" class="text-green-600">免费</span>
                    <span v-else class="text-orange-600">¥{{ resource.price }}</span>
                  </div>
                </td>

                <!-- 状态 -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <el-tag
                    :type="getStatusType(resource.status)"
                    size="small"
                  >
                    {{ getStatusLabel(resource.status) }}
                  </el-tag>
                </td>

                <!-- 可见性 -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="resource.status === 'published'" class="flex items-center space-x-2">
                    <span class="text-sm text-gray-600">
                      {{ resource.is_visible ? '可见' : '隐藏' }}
                    </span>
                    <el-switch
                      v-model="resource.is_visible"
                      @change="updateVisibility(resource)"
                      size="small"
                    />
                  </div>
                  <span v-else class="text-sm text-gray-400">-</span>
                </td>

                <!-- 统计 -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex space-x-4 text-sm">
                    <div class="flex items-center text-gray-600">
                      <el-icon class="mr-1">
                        <View />
                      </el-icon>
                      {{ resource.view_count }}
                    </div>
                    <div class="flex items-center text-gray-600">
                      <el-icon class="mr-1">
                        <ShoppingCart />
                      </el-icon>
                      {{ resource.purchase_count }}
                    </div>
                  </div>
                </td>

                <!-- 时间 -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{{ formatTime(resource.created_at) }}</div>
                  <div v-if="resource.published_at" class="text-xs text-gray-400">
                    发布于 {{ formatTime(resource.published_at) }}
                  </div>
                </td>

                <!-- 操作 -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <el-button
                      type="primary"
                      size="small"
                      @click="viewResource(resource.id)"
                    >
                      查看
                    </el-button>
                    <el-button
                      size="small"
                      @click="editResource(resource.id)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      type="danger"
                      size="small"
                      @click="deleteResource(resource)"
                    >
                      删除
                    </el-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="resources.length > 0" class="mt-6 flex justify-center">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalResources"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Folder,
  Check,
  Edit,
  Money,
  Plus,
  Refresh,
  Loading,
  View,
  ShoppingCart
} from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { ResourceService } from '../../services/resourceService'
import { Resource, ResourceQueryParams, UserResourceStats, ResourceStatus } from '../../types/resources'
import { ResourceCategoryLabels } from '../../types/resources'
import { CloudPlatformLabels } from '../../types/resources'
import { ResourceStatusLabels } from '../../types/resources'
import EmptyState from '../../components/EmptyState.vue'
import StatCard from '../../components/StatCard.vue'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const resources = ref<Resource[]>([])
const stats = ref<UserResourceStats>({
  total_resources: 0,
  published_resources: 0,
  draft_resources: 0,
  total_views: 0,
  total_purchases: 0,
  total_revenue: 0
})
const filterStatus = ref('all')
const filterPrice = ref('all')
const sortBy = ref('newest')
const currentPage = ref(1)
const pageSize = ref(10)
const totalResources = ref(0)
const loading = ref(false)

// 计算属性
const isAuthenticated = computed(() => authStore.isAuthenticated)

// 生命周期
onMounted(() => {
  if (!isAuthenticated.value) {
    router.push({
      name: 'Login',
      query: { redirect: router.currentRoute.value.fullPath }
    })
  } else {
    loadData()
  }
})

// 方法
const loadData = async () => {
  await Promise.all([loadResources(), loadStats()])
}

const loadResources = async () => {
  loading.value = true
  try {
    const userId = authStore.user?.id
    if (!userId) return

    const params: ResourceQueryParams = {
      page: currentPage.value,
      limit: pageSize.value,
      user_id: userId,
      status: filterStatus.value === 'all' ? undefined : filterStatus.value as ResourceStatus,
      sort_by: getSortByField(sortBy.value),
      sort_order: getSortOrder(sortBy.value)
    }

    // 价格筛选
    if (filterPrice.value === 'free') {
      params.is_free = true
    } else if (filterPrice.value === 'paid') {
      params.is_free = false
    }

    const response = await ResourceService.getUserResources(userId, params)
    resources.value = response.data
    totalResources.value = response.pagination.total
  } catch (error) {
    console.error('Error loading resources:', error)
    ElMessage.error('加载资源失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    stats.value = await ResourceService.getUserResourceStats(userId)
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

const getSortByField = (sort: string) => {
  switch (sort) {
    case 'oldest':
      return 'created_at'
    case 'price_high':
    case 'price_low':
      return 'price'
    case 'purchases':
      return 'purchase_count'
    case 'views':
      return 'view_count'
    default:
      return 'created_at'
  }
}

const getSortOrder = (sort: string): 'asc' | 'desc' => {
  switch (sort) {
    case 'oldest':
    case 'price_low':
      return 'asc'
    default:
      return 'desc'
  }
}

const getCategoryLabel = (category: string) => {
  return ResourceCategoryLabels[category as keyof typeof ResourceCategoryLabels] || '其他'
}

const getPlatformLabel = (platform: string) => {
  return CloudPlatformLabels[platform as keyof typeof CloudPlatformLabels] || '其他'
}

const getStatusLabel = (status: string) => {
  return ResourceStatusLabels[status as ResourceStatus] || '未知'
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'info'
    default:
      return 'default'
  }
}

const formatTime = (timeString: string) => {
  const date = new Date(timeString)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadResources()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadResources()
}

const refreshData = () => {
  currentPage.value = 1
  loadData()
}

const navigateToCreate = () => {
  router.push('/resources/create')
}

const viewResource = (resourceId: string) => {
  router.push(`/resources/${resourceId}`)
}

const editResource = (resourceId: string) => {
  router.push(`/resources/${resourceId}/edit`)
}

const updateVisibility = async (resource: Resource) => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    await ResourceService.updateResource(resource.id, {
      is_visible: resource.is_visible
    }, userId)

    ElMessage.success(resource.is_visible ? '资源已设为可见' : '资源已设为隐藏')
  } catch (error: any) {
    console.error('Error updating resource visibility:', error)
    ElMessage.error(error.message || '更新失败')
    // 回滚状态
    resource.is_visible = !resource.is_visible
  }
}

const deleteResource = (resource: Resource) => {
  ElMessageBox.confirm(
    `确定要删除资源"${resource.title}"吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      beforeClose: async (action, instance, done) => {
        if (action === 'confirm') {
          instance.confirmButtonLoading = true
          try {
            const userId = authStore.user?.id
            if (!userId) throw new Error('用户未登录')

            await ResourceService.deleteResource(resource.id, userId)
            ElMessage.success('资源删除成功')
            loadResources()
            loadStats()
          } catch (error: any) {
            console.error('Error deleting resource:', error)
            ElMessage.error(error.message || '删除失败')
          } finally {
            instance.confirmButtonLoading = false
            done()
          }
        } else {
          done()
        }
      }
    }
  )
}
</script>
