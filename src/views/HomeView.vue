<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Folder, ShoppingCart } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { ResourceService } from '../services/resourceService'
import type { Resource } from '../types/resources'

const router = useRouter()
const authStore = useAuthStore()

const hotResources = ref<Resource[]>([])
const newResources = ref<Resource[]>([])
const loading = ref(false)

// 方法
const loadData = async () => {
  if (!authStore.isAuthenticated || !authStore.user?.id) return

  loading.value = true
  try {
    // 并行加载数据
    const [hotRes, newRes] = await Promise.all([
      ResourceService.getHotResources(20),
      ResourceService.getNewResources(20)
    ])

    hotResources.value = hotRes
    newResources.value = newRes
  } catch (error) {
    console.error('Error loading home data:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const viewResource = (resourceId: string) => {
  router.push(`/resources/${resourceId}`)
}

const viewAllResources = () => {
  router.push('/resources')
}

// 生命周期
onMounted(() => {
  if (authStore.isAuthenticated) {
    loadData()
  }
})
</script>

<template>
  <div class="bg-gray-50 min-h-[calc(100vh-64px)]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 热门资源 -->
      <div v-if="hotResources.length > 0" class="mb-8">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-900">热门资源</h3>
          <el-button type="primary" link @click="viewAllResources">
            查看全部
            <el-icon class="ml-1"><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            v-for="resource in hotResources"
            :key="resource.id"
            class="bg-white rounded-xl shadow-card overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-card-hover"
            @click="viewResource(resource.id)"
          >
            <div class="h-32 overflow-hidden">
              <img
                v-if="resource.cover_url"
                :src="resource.cover_url"
                :alt="resource.title"
                class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100"
              >
                <el-icon class="text-4xl text-gray-400">
                  <Folder />
                </el-icon>
              </div>
            </div>
            <div class="p-4">
              <h4 class="font-medium text-gray-900 line-clamp-1">{{ resource.title }}</h4>
              <div class="flex items-center justify-between mt-2">
                <span v-if="resource.is_free" class="text-sm text-green-600 font-medium">免费</span>
                <span v-else class="text-sm text-orange-600 font-medium">¥{{ resource.price }}</span>
                <div class="flex items-center text-xs text-gray-500">
                  <el-icon class="mr-1"><ShoppingCart /></el-icon>
                  {{ resource.purchase_count }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最新资源 -->
      <div v-if="newResources.length > 0" class="mb-8">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-900">最新资源</h3>
          <el-button type="primary" link @click="viewAllResources">
            查看全部
            <el-icon class="ml-1"><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            v-for="resource in newResources"
            :key="resource.id"
            class="bg-white rounded-xl shadow-card overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-card-hover"
            @click="viewResource(resource.id)"
          >
            <div class="h-32 overflow-hidden">
              <img
                v-if="resource.cover_url"
                :src="resource.cover_url"
                :alt="resource.title"
                class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100"
              >
                <el-icon class="text-4xl text-gray-400">
                  <Folder />
                </el-icon>
              </div>
            </div>
            <div class="p-4">
              <h4 class="font-medium text-gray-900 line-clamp-1">{{ resource.title }}</h4>
              <div class="flex items-center justify-between mt-2">
                <span v-if="resource.is_free" class="text-sm text-green-600 font-medium">免费</span>
                <span v-else class="text-sm text-orange-600 font-medium">¥{{ resource.price }}</span>
                <div class="flex items-center text-xs text-gray-500">
                  <el-icon class="mr-1"><ShoppingCart /></el-icon>
                  {{ resource.purchase_count }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
export { ArrowRight }
</script>
