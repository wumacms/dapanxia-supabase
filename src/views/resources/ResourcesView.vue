<template>
  <div class="bg-gray-50 min-h-[calc(100vh-64px)]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 面包屑导航 -->
      <div class="mb-6">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ name: 'Home' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>资源库</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">网盘资源库</h1>
        <p class="mt-2 text-gray-500">浏览和搜索海量网盘资源</p>
      </div>

      <!-- 搜索和筛选区域 -->
      <div class="bg-white rounded-xl p-6 shadow-card mb-6">
        <!-- 搜索框 -->
        <div class="mb-6">
          <el-input
            v-model="searchQuery"
            placeholder="搜索资源名称或描述..."
            size="large"
            clearable
            @input="handleSearch"
            class="w-full"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- 筛选条件 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- 分类筛选 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">资源分类</label>
            <el-select
              v-model="selectedCategory"
              placeholder="选择分类"
              size="large"
              clearable
              @change="handleFilterChange"
              class="w-full"
            >
              <el-option
                v-for="category in categories"
                :key="category.value"
                :label="category.label"
                :value="category.value"
              />
            </el-select>
          </div>

          <!-- 网盘平台筛选 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">网盘平台</label>
            <el-select
              v-model="selectedPlatform"
              placeholder="选择平台"
              size="large"
              clearable
              @change="handleFilterChange"
              class="w-full"
            >
              <el-option
                v-for="platform in platforms"
                :key="platform.value"
                :label="platform.label"
                :value="platform.value"
              />
            </el-select>
          </div>

          <!-- 价格筛选 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">价格范围</label>
            <el-select
              v-model="priceRange"
              placeholder="价格范围"
              size="large"
              clearable
              @change="handleFilterChange"
              class="w-full"
            >
              <el-option label="全部" value="all" />
              <el-option label="免费" value="free" />
              <el-option label="0-10元" value="0-10" />
              <el-option label="10-50元" value="10-50" />
              <el-option label="50-100元" value="50-100" />
              <el-option label="100元以上" value="100+" />
            </el-select>
          </div>

          <!-- 排序方式 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
            <el-select
              v-model="sortBy"
              size="large"
              @change="handleFilterChange"
              class="w-full"
            >
              <el-option label="最新发布" value="newest" />
              <el-option label="最热资源" value="hottest" />
              <el-option label="价格最低" value="price_low" />
              <el-option label="价格最高" value="price_high" />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-12">
        <el-icon class="text-4xl text-blue-500 is-loading">
          <Loading />
        </el-icon>
        <p class="mt-4 text-gray-500">加载资源中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="resources.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-card">
        <el-icon class="text-6xl text-gray-300 mb-4">
          <FolderOpened />
        </el-icon>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">暂无资源</h3>
        <p class="text-gray-500 mb-6">暂时没有找到符合条件的资源</p>
        <el-button type="primary" @click="resetFilters" size="large">
          重置筛选条件
        </el-button>
      </div>

      <!-- 资源网格 -->
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ResourceCard
            v-for="resource in resources"
            :key="resource.id"
            :resource="resource"
            @card-click="viewResource"
          />
        </div>

        <!-- 分页 -->
        <div class="mt-8 flex justify-center">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 48, 96]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalResources"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Loading, FolderOpened } from '@element-plus/icons-vue'
import ResourceCard from '../../components/resources/ResourceCard.vue'
import { ResourceService } from '../../services/resourceService'
import { Resource, ResourceQueryParams, ResourceCategory, CloudPlatform } from '../../types/resources'
import { ResourceCategoryLabels } from '../../types/resources'
import { CloudPlatformLabels } from '../../types/resources'

const router = useRouter()

// 响应式数据
const searchQuery = ref('')
const selectedCategory = ref<ResourceCategory | 'all'>('all')
const selectedPlatform = ref<CloudPlatform | 'all'>('all')
const priceRange = ref('all')
const sortBy = ref('newest')
const currentPage = ref(1)
const pageSize = ref(12)
const totalResources = ref(0)
const resources = ref<Resource[]>([])
const loading = ref(false)

// 筛选选项
const categories = computed(() => [
  { label: '全部', value: 'all' },
  ...Object.entries(ResourceCategoryLabels).map(([value, label]) => ({
    label,
    value
  }))
])

const platforms = computed(() => [
  { label: '全部', value: 'all' },
  ...Object.entries(CloudPlatformLabels).map(([value, label]) => ({
    label,
    value
  }))
])

// 生命周期
onMounted(() => {
  loadResources()
})

// 方法
const loadResources = async () => {
  loading.value = true
  try {
    const params: ResourceQueryParams = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      category: selectedCategory.value !== 'all' ? selectedCategory.value : 'all',
      platform: selectedPlatform.value !== 'all' ? selectedPlatform.value : 'all',
      sort_by: getSortByField(sortBy.value),
      sort_order: getSortOrder(sortBy.value)
    }

    // 价格筛选
    if (priceRange.value !== 'all') {
      switch (priceRange.value) {
        case 'free':
          params.is_free = true
          break
        case '0-10':
          params.min_price = 0
          params.max_price = 10
          params.is_free = false
          break
        case '10-50':
          params.min_price = 10
          params.max_price = 50
          params.is_free = false
          break
        case '50-100':
          params.min_price = 50
          params.max_price = 100
          params.is_free = false
          break
        case '100+':
          params.min_price = 100
          params.is_free = false
          break
      }
    }

    const response = await ResourceService.getResources(params)
    resources.value = response.data
    totalResources.value = response.pagination.total
  } catch (error) {
    console.error('Error loading resources:', error)
    ElMessage.error('加载资源失败')
  } finally {
    loading.value = false
  }
}

const getSortByField = (sort: string) => {
  switch (sort) {
    case 'hottest':
      return 'purchase_count'
    case 'price_low':
    case 'price_high':
      return 'price'
    default:
      return 'created_at'
  }
}

const getSortOrder = (sort: string): 'asc' | 'desc' => {
  switch (sort) {
    case 'price_low':
      return 'asc'
    case 'price_high':
      return 'desc'
    default:
      return 'desc'
  }
}

const handleSearch = () => {
  // 防抖处理
  clearTimeout((window as any).searchTimer)
  ;(window as any).searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadResources()
  }, 500)
}

const handleFilterChange = () => {
  currentPage.value = 1
  loadResources()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadResources()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadResources()
}

const viewResource = (resourceId: string) => {
  router.push(`/resources/${resourceId}`)
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  selectedPlatform.value = 'all'
  priceRange.value = 'all'
  sortBy.value = 'newest'
  currentPage.value = 1
  loadResources()
}
</script>
