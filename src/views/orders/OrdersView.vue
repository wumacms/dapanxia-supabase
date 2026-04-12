<template>
  <div class="bg-gray-50 min-h-[calc(100vh-64px)]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 面包屑导航 -->
      <div class="mb-6">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ name: 'Home' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>我的订单</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">我的订单</h1>
        <p class="mt-2 text-gray-500">查看和管理您的所有购买订单</p>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- 总订单数 -->
        <div class="bg-white rounded-xl p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">总订单数</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.total_orders || 0 }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <el-icon class="text-2xl text-blue-600">
                <List />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 待支付 -->
        <div class="bg-white rounded-xl p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover border-l-4 border-yellow-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">待支付</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.pending_orders || 0 }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <el-icon class="text-2xl text-yellow-600">
                <Clock />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 已支付 -->
        <div class="bg-white rounded-xl p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">已支付</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.paid_orders || 0 }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <el-icon class="text-2xl text-green-600">
                <Check />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 总消费 -->
        <div class="bg-white rounded-xl p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover border-l-4 border-purple-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">总消费</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">¥{{ stats.total_spent?.toFixed(2) || '0.00' }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <el-icon class="text-2xl text-purple-600">
                <Money />
              </el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 筛选和操作栏 -->
      <div class="bg-white rounded-xl p-6 shadow-card mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- 状态筛选 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">订单状态</label>
            <el-select
              v-model="filterStatus"
              placeholder="所有状态"
              size="large"
              class="w-full"
              @change="loadOrders"
            >
              <el-option label="所有状态" value="all" />
              <el-option label="待支付" value="pending" />
              <el-option label="已支付" value="paid" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
              <el-option label="已退款" value="refunded" />
            </el-select>
          </div>

          <!-- 时间范围 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">时间范围</label>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="large"
              style="width: 100%; min-width: 200px"
              @change="loadOrders"
            />
          </div>

          <!-- 搜索 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">关键词搜索</label>
            <el-input
              v-model="searchQuery"
              placeholder="搜索订单号或资源名称..."
              size="large"
              class="w-full"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-end space-x-2">
            <el-button
              size="large"
              @click="refreshData"
              :loading="loading"
            >
              <el-icon class="mr-2">
                <Refresh />
              </el-icon>
              刷新
            </el-button>
            <el-button
              size="large"
              @click="exportOrders"
              :loading="exporting"
            >
              <el-icon class="mr-2">
                <Download />
              </el-icon>
              导出
            </el-button>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading && orders.length === 0" class="flex flex-col items-center justify-center py-12">
        <el-icon class="text-4xl text-blue-500 is-loading">
          <Loading />
        </el-icon>
        <p class="mt-4 text-gray-500">加载订单中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="orders.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-card">
        <el-icon class="text-6xl text-gray-300 mb-4">
          <ShoppingCart />
        </el-icon>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">暂无订单</h3>
        <p class="text-gray-500 mb-6">您还没有购买过任何资源</p>
        <el-button type="primary" @click="browseResources" size="large">
          浏览资源
        </el-button>
      </div>

      <!-- 订单列表 -->
      <div v-else class="bg-white rounded-xl shadow-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  订单信息
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  资源信息
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  支付信息
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="order in orders"
                :key="order.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <!-- 订单信息 -->
                <td class="px-6 py-4">
                  <div class="space-y-2">
                    <div>
                      <p class="text-sm font-medium text-gray-900">
                        {{ order.order_no }}
                      </p>
                      <p class="text-xs text-gray-500 mt-1">
                        创建时间：{{ formatDateTime(order.created_at) }}
                      </p>
                    </div>
                    <div>
                      <el-tag :type="getStatusTagType(order.payment_status)" size="small">
                        {{ getStatusLabel(order.payment_status) }}
                      </el-tag>
                    </div>
                  </div>
                </td>

                <!-- 资源信息 -->
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-12 w-12 mr-4">
                      <img
                        v-if="order.resource?.cover_url"
                        :src="order.resource.cover_url"
                        :alt="order.resource.title"
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
                        {{ order.resource?.title || order.resource_title || '资源已下架' }}
                      </p>
                      <p v-if="order.resource" class="text-xs text-gray-500 mt-1">
                        {{ getCategoryLabel(order.resource?.category) }} | {{ getPlatformLabel(order.resource?.platform) }}
                      </p>
                    </div>
                  </div>
                </td>

                <!-- 支付信息 -->
                <td class="px-6 py-4">
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">金额：</span>
                      <span class="text-sm font-medium text-orange-600">
                        ¥{{ order.amount }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">渠道：</span>
                      <span class="text-sm font-medium">
                        {{ getPaymentChannelLabel(order.payment_channel) }}
                      </span>
                    </div>
                    <div v-if="order.payment_time" class="flex justify-between">
                      <span class="text-sm text-gray-600">支付时间：</span>
                      <span class="text-sm font-medium">
                        {{ formatDateTime(order.payment_time) }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- 操作 -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <el-button
                      type="primary"
                      size="small"
                      @click="viewOrder(order.id)"
                    >
                      查看详情
                    </el-button>
                    <el-button
                      v-if="order.payment_status === 'pending'"
                      type="warning"
                      size="small"
                      @click="payOrder(order)"
                    >
                      继续支付
                    </el-button>
                    <el-button
                      v-if="order.payment_status === 'paid' || order.payment_status === 'completed'"
                      type="success"
                      size="small"
                      @click="downloadResource(order)"
                    >
                      下载资源
                    </el-button>
                    <el-button
                      v-if="order.payment_status === 'cancelled'"
                      type="danger"
                      size="small"
                      @click="deleteOrder(order)"
                    >
                      删除订单
                    </el-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="orders.length > 0" class="mt-6 flex justify-center">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalOrders"
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
  List,
  Clock,
  Check,
  Money,
  Refresh,
  Download,
  Loading,
  ShoppingCart,
  Folder,
  Search
} from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { OrderService } from '../../services/orderService'
import type { Order, PaymentChannel } from '../../types/resources'
import { OrderStatus, OrderStatusLabels, PaymentChannelLabels } from '../../types/resources'
import { ResourceCategoryLabels } from '../../types/resources'
import { CloudPlatformLabels } from '../../types/resources'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const orders = ref<Order[]>([])
const stats = ref({
  total_orders: 0,
  pending_orders: 0,
  paid_orders: 0,
  total_spent: 0
})
const filterStatus = ref('all')
const dateRange = ref<[Date, Date] | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalOrders = ref(0)
const loading = ref(false)
const exporting = ref(false)

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
  await Promise.all([loadOrders(), loadStats()])
}

const loadOrders = async () => {
  loading.value = true
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // 构建筛选参数
    const options: any = {}
    
    // 状态筛选
    if (filterStatus.value !== 'all') {
      options.status = filterStatus.value
    }
    
    // 时间范围筛选
    if (dateRange.value && dateRange.value.length === 2) {
      options.startDate = dateRange.value[0].toISOString()
      options.endDate = dateRange.value[1].toISOString()
    }
    
    // 关键词搜索
    if (searchQuery.value.trim()) {
      options.search = searchQuery.value.trim()
    }

    const response = await OrderService.getUserOrders(userId, currentPage.value, pageSize.value, options)
    orders.value = response.data
    totalOrders.value = response.pagination.total
  } catch (error) {
    console.error('Error loading orders:', error)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    const orderStats = await OrderService.getOrderStats(userId)
    stats.value = orderStats
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

const handleSearch = () => {
  // 防抖处理
  clearTimeout((window as any).searchTimer)
  ;(window as any).searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadOrders()
  }, 500)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadOrders()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadOrders()
}

const refreshData = () => {
  currentPage.value = 1
  loadData()
}

const exportOrders = async () => {
  exporting.value = true
  try {
    // 这里可以实现导出功能，例如导出为Excel或CSV
    // 暂时只显示提示
    ElMessage.info('导出功能开发中...')
  } catch (error) {
    console.error('Error exporting orders:', error)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

const getStatusLabel = (status?: OrderStatus) => {
  return OrderStatusLabels[status || OrderStatus.PENDING]
}

const getStatusTagType = (status?: OrderStatus) => {
  switch (status) {
    case OrderStatus.PAID:
    case OrderStatus.COMPLETED:
      return 'success'
    case OrderStatus.PENDING:
      return 'warning'
    case OrderStatus.CANCELLED:
      return 'danger'
    case OrderStatus.REFUNDED:
      return 'info'
    default:
      return 'default'
  }
}

const getCategoryLabel = (category?: string | null) => {
  return ResourceCategoryLabels[category as keyof typeof ResourceCategoryLabels] || '其他'
}

const getPlatformLabel = (platform?: string | null) => {
  return CloudPlatformLabels[platform as keyof typeof CloudPlatformLabels] || '其他'
}

const getPaymentChannelLabel = (channel?: PaymentChannel | null) => {
  return channel ? PaymentChannelLabels[channel] : '未选择'
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const viewOrder = (orderId: string) => {
  router.push(`/orders/${orderId}`)
}

const payOrder = (order: Order) => {
  router.push(`/orders/${order.id}`)
}

const downloadResource = (order: Order) => {
  if (!order.resource_url) {
    ElMessage.warning('资源链接不存在')
    return
  }

  window.open(order.resource_url, '_blank')
}

const browseResources = () => {
  router.push('/resources')
}

const deleteOrder = async (order: Order) => {
  ElMessageBox.confirm(
    '确定要删除此订单吗？删除后无法恢复。',
    '删除订单确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const userId = authStore.user?.id
      if (!userId) throw new Error('用户未登录')

      console.log('Deleting order:', order.id, order.order_no)
      await OrderService.deleteOrder(order.id, userId)
      console.log('Order deleted successfully')

      ElMessage.success('订单已删除')

      // 如果当前页只有一条记录且不是第一页，则回到上一页
      if (orders.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }

      // 重新加载订单列表
      await loadOrders()
      // 更新统计数据
      await loadStats()
    } catch (err: any) {
      console.error('Error deleting order:', err)
      ElMessage.error(err.message || '删除订单失败')
    }
  }).catch(() => {
    // 用户点击了取消
  })
}
</script>
