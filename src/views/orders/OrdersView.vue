<template>
  <div class="orders-view">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- 面包屑导航 -->
      <div class="mb-6">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ name: 'Resources' }">
            资源列表
          </el-breadcrumb-item>
          <el-breadcrumb-item>我的订单</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">我的订单</h1>
        <p class="mt-2 text-gray-600">
          查看和管理您的所有购买订单
        </p>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- 总订单数 -->
        <div class="stat-card bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-90">总订单数</p>
              <p class="text-3xl font-bold mt-2">{{ stats.total_orders || 0 }}</p>
            </div>
            <el-icon class="text-4xl opacity-80">
              <List />
            </el-icon>
          </div>
        </div>

        <!-- 待支付 -->
        <div class="stat-card bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-90">待支付</p>
              <p class="text-3xl font-bold mt-2">{{ stats.pending_orders || 0 }}</p>
            </div>
            <el-icon class="text-4xl opacity-80">
              <Clock />
            </el-icon>
          </div>
        </div>

        <!-- 已支付 -->
        <div class="stat-card bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-90">已支付</p>
              <p class="text-3xl font-bold mt-2">{{ stats.paid_orders || 0 }}</p>
            </div>
            <el-icon class="text-4xl opacity-80">
              <Check />
            </el-icon>
          </div>
        </div>

        <!-- 总消费 -->
        <div class="stat-card bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-90">总消费</p>
              <p class="text-3xl font-bold mt-2">¥{{ stats.total_spent?.toFixed(2) || '0.00' }}</p>
            </div>
            <el-icon class="text-4xl opacity-80">
              <Money />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 筛选和操作栏 -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <!-- 筛选 -->
          <div class="flex flex-wrap items-center space-x-4">
            <!-- 状态筛选 -->
            <el-select
              v-model="filterStatus"
              placeholder="所有状态"
              size="large"
              style="width: 150px"
              @change="loadOrders"
            >
              <el-option label="所有状态" value="all" />
              <el-option label="待支付" value="pending" />
              <el-option label="已支付" value="paid" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
              <el-option label="已退款" value="refunded" />
            </el-select>

            <!-- 时间范围 -->
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="large"
              style="width: 250px"
              @change="loadOrders"
            />

            <!-- 搜索 -->
            <el-input
              v-model="searchQuery"
              placeholder="搜索订单号或资源名称..."
              size="large"
              style="width: 200px"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <!-- 操作按钮 -->
          <div class="flex space-x-3">
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
      <div v-if="loading && orders.length === 0" class="text-center py-12">
        <el-icon class="is-loading text-4xl text-blue-500">
          <Loading />
        </el-icon>
        <p class="mt-4 text-gray-600">加载订单中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="orders.length === 0" class="text-center py-12">
        <el-icon class="text-6xl text-gray-400 mb-4">
          <ShoppingCart />
        </el-icon>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">暂无订单</h3>
        <p class="text-gray-600 mb-6">您还没有购买过任何资源</p>
        <el-button type="primary" @click="browseResources" size="large">
          浏览资源
        </el-button>
      </div>

      <!-- 订单列表 -->
      <div v-else class="bg-white rounded-xl shadow-md overflow-hidden">
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
                        {{ order.resource?.title }}
                      </p>
                      <p class="text-xs text-gray-500 mt-1">
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
import { ElMessage } from 'element-plus'
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

    const response = await OrderService.getUserOrders(userId, currentPage.value, pageSize.value)
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

const getCategoryLabel = (category?: string) => {
  return ResourceCategoryLabels[category as keyof typeof ResourceCategoryLabels] || '其他'
}

const getPlatformLabel = (platform?: string) => {
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
  if (!order.resource?.resource_url) {
    ElMessage.warning('资源链接不存在')
    return
  }
  
  window.open(order.resource.resource_url, '_blank')
}

const browseResources = () => {
  router.push('/resources')
}
</script>

<style scoped>
.orders-view {
  min-height: calc(100vh - 64px);
  background-color: #f8fafc;
}

.stat-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* 表格样式 */
:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-table__header-wrapper) {
  border-radius: 12px 12px 0 0;
}

:deep(.el-table__body-wrapper) {
  border-radius: 0 0 12px 12px;
}

/* 日期选择器样式 */
:deep(.el-date-editor) {
  border-radius: 8px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

/* 按钮样式 */
:deep(.el-button) {
  transition: all 0.3s ease;
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
}
</style>