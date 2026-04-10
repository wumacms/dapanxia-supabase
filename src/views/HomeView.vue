<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Folder, Check, List, Money, ShoppingCart } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { ResourceService } from '../services/resourceService'
import { OrderService } from '../services/orderService'
import AvatarUploader from '../components/AvatarUploader.vue'
import type { UserResourceStats, Resource } from '../types/resources'

const router = useRouter()
const authStore = useAuthStore()
const drawer = ref(false)

// 响应式数据
const stats = ref([
  { label: '我的资源', value: '0', change: '', up: true, icon: Folder },
  { label: '已发布', value: '0', change: '', up: true, icon: Check },
  { label: '我的订单', value: '0', change: '', up: true, icon: List },
  { label: '总消费', value: '¥0.00', change: '', up: true, icon: Money },
])

const hotResources = ref<Resource[]>([])
const newResources = ref<Resource[]>([])
const myResourcesStats = ref<UserResourceStats | null>(null)
const orderStats = ref<any>(null)
const loading = ref(false)

// 方法
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await authStore.signOut()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {
    // 用户取消
  }
}

const goToMyResources = () => {
  router.push('/my-resources')
}

const goToOrders = () => {
  router.push('/orders')
}

const loadData = async () => {
  if (!authStore.isAuthenticated || !authStore.user?.id) return

  loading.value = true
  try {
    const userId = authStore.user.id

    // 并行加载数据
    const [resourcesStats, ordersStats, hotRes, newRes] = await Promise.all([
      ResourceService.getUserResourceStats(userId),
      OrderService.getOrderStats(userId),
      ResourceService.getHotResources(5),
      ResourceService.getNewResources(5)
    ])

    myResourcesStats.value = resourcesStats
    orderStats.value = ordersStats

    // 更新统计卡片
    stats.value[0].value = resourcesStats.total_resources.toString()
    stats.value[1].value = resourcesStats.published_resources.toString()
    stats.value[2].value = ordersStats.total_orders.toString()
    stats.value[3].value = `¥${ordersStats.total_spent.toFixed(2)}`

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

const createResource = () => {
  router.push('/resources/create')
}

const viewOrder = () => {
  router.push('/orders')
}

// 生命周期
onMounted(() => {
  if (authStore.isAuthenticated) {
    loadData()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- 顶部导航 -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- 左侧导航链接 -->
          <div class="flex items-center space-x-8">
            <router-link to="/" class="flex items-center">
              <h1 class="text-xl font-bold text-blue-600">网盘资源发布系统</h1>
            </router-link>
            <div class="hidden md:flex items-center space-x-6">
              <router-link 
                to="/resources" 
                class="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                active-class="text-blue-600"
              >
                资源库
              </router-link>
              <router-link 
                to="/my-resources" 
                class="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                active-class="text-blue-600"
              >
                我的资源
              </router-link>
              <router-link 
                to="/orders" 
                class="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                active-class="text-blue-600"
              >
                我的订单
              </router-link>
            </div>
          </div>
          
          <!-- 右侧用户信息 -->
          <div class="flex items-center gap-4">
            <!-- 发布资源按钮 -->
            <router-link to="/resources/create">
              <el-button type="primary" size="small">
                <el-icon class="mr-2">
                  <Plus />
                </el-icon>
                发布资源
              </el-button>
            </router-link>
            
            <el-dropdown>
              <div class="flex items-center gap-2 cursor-pointer">
                <AvatarUploader :size="32" />
                <span class="text-gray-700 hidden sm:block">{{ authStore.userEmail }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="drawer = true">个人中心</el-dropdown-item>
                  <el-dropdown-item @click="goToMyResources">我的资源</el-dropdown-item>
                  <el-dropdown-item @click="goToOrders">我的订单</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主内容 -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- 欢迎信息 -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-800">欢迎回来，{{ authStore.userEmail }}!</h2>
        <p class="text-gray-500 mt-1">欢迎使用网盘资源发布系统</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-12">
        <el-icon class="is-loading text-4xl text-blue-500">
          <Loading />
        </el-icon>
        <p class="mt-4 text-gray-600">加载数据中...</p>
      </div>

      <!-- 统计卡片 -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          v-for="(stat, index) in stats"
          :key="index"
          class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          @click="index === 0 || index === 1 ? goToMyResources() : viewOrder()"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">{{ stat.label }}</p>
              <p class="text-2xl font-bold text-gray-800 mt-2">{{ stat.value }}</p>
            </div>
            <el-icon class="text-3xl text-blue-500 opacity-80">
              <component :is="stat.icon" />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 热门资源 -->
      <div v-if="hotResources.length > 0" class="mb-8">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-800">热门资源</h3>
          <el-button type="primary" text @click="viewAllResources">
            查看全部
          </el-button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            v-for="resource in hotResources"
            :key="resource.id"
            class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
            @click="viewResource(resource.id)"
          >
            <div class="h-32 rounded-lg overflow-hidden mb-3">
              <img
                v-if="resource.cover_url"
                :src="resource.cover_url"
                :alt="resource.title"
                class="w-full h-full object-cover"
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
            <h4 class="font-medium text-gray-900 line-clamp-1">{{ resource.title }}</h4>
            <div class="flex items-center justify-between mt-2">
              <span v-if="resource.is_free" class="text-sm text-green-600">免费</span>
              <span v-else class="text-sm text-orange-600">¥{{ resource.price }}</span>
              <div class="flex items-center text-xs text-gray-500">
                <el-icon class="mr-1">
                  <ShoppingCart />
                </el-icon>
                {{ resource.purchase_count }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最新资源 -->
      <div v-if="newResources.length > 0" class="mb-8">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-800">最新资源</h3>
          <el-button type="primary" text @click="viewAllResources">
            查看全部
          </el-button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            v-for="resource in newResources"
            :key="resource.id"
            class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
            @click="viewResource(resource.id)"
          >
            <div class="h-32 rounded-lg overflow-hidden mb-3">
              <img
                v-if="resource.cover_url"
                :src="resource.cover_url"
                :alt="resource.title"
                class="w-full h-full object-cover"
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
            <h4 class="font-medium text-gray-900 line-clamp-1">{{ resource.title }}</h4>
            <div class="flex items-center justify-between mt-2">
              <span v-if="resource.is_free" class="text-sm text-green-600">免费</span>
              <span v-else class="text-sm text-orange-600">¥{{ resource.price }}</span>
              <div class="flex items-center text-xs text-gray-500">
                <el-icon class="mr-1">
                  <ShoppingCart />
                </el-icon>
                {{ resource.purchase_count }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h3 class="text-xl font-bold">开始使用网盘资源系统</h3>
            <p class="text-blue-100 mt-2">发布资源、浏览资源、管理订单</p>
          </div>
          <div class="flex space-x-4 mt-4 md:mt-0">
            <el-button type="primary" @click="createResource" size="large" class="bg-white text-blue-600 hover:bg-gray-100">
              <el-icon class="mr-2">
                <Plus />
              </el-icon>
              发布新资源
            </el-button>
            <el-button @click="viewAllResources" size="large" class="bg-transparent border-2 border-white text-white hover:bg-white/10">
              浏览资源库
            </el-button>
          </div>
        </div>
      </div>
    </main>

    <!-- 个人中心抽屉 -->
    <el-drawer v-model="drawer" title="个人中心" size="400">
      <div class="p-6 space-y-6">
        <div class="text-center">
          <AvatarUploader :size="80" :editable="true" />
          <h3 class="mt-4 font-medium text-gray-800">{{ authStore.userEmail }}</h3>
          <p class="text-gray-400 text-sm mt-1">点击头像可更换</p>
        </div>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户ID">
            {{ authStore.user?.id }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            {{ authStore.userEmail }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱已验证">
            <el-tag :type="authStore.user?.email_confirmed_at ? 'success' : 'warning'">
              {{ authStore.user?.email_confirmed_at ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ new Date(authStore.user?.created_at || '').toLocaleString() }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="flex gap-3">
          <el-button type="primary" class="flex-1" @click="router.push('/change-password')">
            修改密码
          </el-button>
          <el-button type="danger" class="flex-1" @click="handleLogout">退出登录</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.stat-card {
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}
</style>