<template>
  <div class="bg-gray-50 min-h-[calc(100vh-64px)]">
    <div v-if="loading" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="flex flex-col items-center justify-center py-12">
        <el-icon class="text-4xl text-blue-500 is-loading">
          <Loading />
        </el-icon>
        <p class="mt-4 text-gray-500">加载订单信息中...</p>
      </div>
    </div>

    <div v-else-if="error" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-card">
        <el-icon class="text-6xl text-red-500 mb-4">
          <CircleCloseFilled />
        </el-icon>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">加载失败</h3>
        <p class="text-gray-500 mb-6">{{ error }}</p>
        <el-button type="primary" @click="$router.back()" size="large">
          返回
        </el-button>
      </div>
    </div>

    <div v-else-if="order" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 面包屑导航 -->
      <div class="mb-6">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ name: 'Home' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ name: 'Orders' }">我的订单</el-breadcrumb-item>
          <el-breadcrumb-item>订单详情</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 订单状态横幅 -->
      <div class="mb-8">
        <div :class="statusBannerClass" class="rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-white mb-2">
                {{ getStatusText(order.payment_status) }}
              </h1>
              <p class="text-white opacity-90">
                订单号：{{ order.order_no }}
              </p>
            </div>
            <el-icon class="text-5xl text-white opacity-80">
              <component :is="statusIcon" />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 订单内容 -->
      <div class="bg-white rounded-xl shadow-card overflow-hidden mb-8">
        <!-- 资源信息 -->
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">资源信息</h2>
          <div class="flex items-start space-x-4">
            <!-- 封面 -->
            <div class="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
              <img
                v-if="getResourceCoverUrl(order)"
                :src="getResourceCoverUrl(order)!"
                :alt="getResourceTitle(order)"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100"
              >
                <el-icon class="text-3xl text-gray-400">
                  <FolderOpened />
                </el-icon>
              </div>
            </div>

            <!-- 资源详情 -->
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ getResourceTitle(order) }}
              </h3>
              <p v-if="getResourceDescription(order)" class="text-sm text-gray-600 mt-1 line-clamp-2">
                {{ getResourceDescription(order) }}
              </p>
              <div class="flex items-center mt-3 space-x-4 text-sm">
                <span class="text-gray-500">
                  分类：{{ getCategoryLabel(getResourceCategory(order)) }}
                </span>
                <span class="text-gray-500">
                  平台：{{ getPlatformLabel(getResourcePlatform(order)) }}
                </span>
              </div>
            </div>

            <!-- 价格 -->
            <div class="text-right">
              <p class="text-2xl font-bold text-orange-600">
                ¥{{ order.amount }}
              </p>
              <p v-if="order.resource?.is_free" class="text-sm text-green-600 mt-1">
                免费资源
              </p>
            </div>
          </div>
        </div>

        <!-- 订单信息 -->
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">订单信息</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 订单基本信息 -->
            <div>
              <h3 class="text-sm font-medium text-gray-500 mb-2">订单详情</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-600">订单号：</span>
                  <span class="font-medium">{{ order.order_no }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">创建时间：</span>
                  <span class="font-medium">{{ formatDateTime(order.created_at) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">过期时间：</span>
                  <span class="font-medium">{{ formatDateTime(order.expires_at) }}</span>
                </div>
                <div v-if="order.payment_time" class="flex justify-between">
                  <span class="text-gray-600">支付时间：</span>
                  <span class="font-medium">{{ formatDateTime(order.payment_time) }}</span>
                </div>
              </div>
            </div>

            <!-- 支付信息 -->
            <div>
              <h3 class="text-sm font-medium text-gray-500 mb-2">支付信息</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-600">支付渠道：</span>
                  <span class="font-medium">{{ getPaymentChannelLabel(order.payment_channel) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">支付状态：</span>
                  <el-tag :type="getStatusTagType(order.payment_status)" size="small">
                    {{ getStatusLabel(order.payment_status) }}
                  </el-tag>
                </div>
                <div v-if="order.external_order_no" class="flex justify-between">
                  <span class="text-gray-600">支付订单号：</span>
                  <span class="font-medium text-sm">{{ order.external_order_no }}</span>
                </div>
                <div v-if="order.external_transaction_no" class="flex justify-between">
                  <span class="text-gray-600">交易号：</span>
                  <span class="font-medium text-sm">{{ order.external_transaction_no }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 支付二维码区域（仅待支付状态显示） -->
        <div v-if="order.payment_status === 'pending'" class="p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">支付方式</h2>

          <div class="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            <!-- 二维码 -->
            <div class="lg:w-1/2">
              <div class="bg-white p-6 rounded-lg border border-gray-200 text-center">
                <div class="mb-4">
                  <p class="text-lg font-semibold text-gray-900">微信扫码支付</p>
                  <p class="text-sm text-gray-600 mt-1">使用微信扫描下方二维码完成支付</p>
                </div>

                <!-- 二维码容器 -->
                <div class="relative inline-block">
                  <div
                    v-if="loadingQRCode"
                    class="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg"
                  >
                    <el-icon class="is-loading text-4xl text-blue-500">
                      <Loading />
                    </el-icon>
                  </div>
                  <img
                    v-else-if="qrCodeUrl"
                    :src="qrCodeUrl"
                    alt="支付二维码"
                    class="w-64 h-64 rounded-lg border border-gray-200"
                  />
                  <div
                    v-else
                    class="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg"
                  >
                    <p class="text-gray-500">加载二维码中...</p>
                  </div>

                  <!-- 二维码刷新按钮 -->
                  <el-button
                    v-if="qrCodeUrl && !loadingQRCode"
                    link
                    class="absolute top-2 right-2"
                    @click="refreshQRCode"
                    :loading="refreshingQRCode"
                  >
                    <el-icon>
                      <Refresh />
                    </el-icon>
                  </el-button>
                </div>

                <!-- 倒计时 -->
                <div class="mt-4">
                  <p class="text-sm text-gray-600">
                    二维码有效时间：
                    <span :class="countdownClass">
                      {{ formatTime(countdown) }}
                    </span>
                  </p>
                </div>

                <!-- 支付说明 -->
                <div class="mt-4 text-xs text-gray-500">
                  <p>请使用微信扫描二维码完成支付</p>
                  <p class="mt-1">支付完成后，系统将自动跳转</p>
                </div>
              </div>
            </div>

            <!-- 支付步骤 -->
            <div class="lg:w-1/2">
              <div class="bg-gray-50 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">支付步骤</h3>
                <div class="space-y-4">
                  <div class="flex items-start">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <span class="text-blue-600 font-bold">1</span>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">打开微信</p>
                      <p class="text-sm text-gray-600 mt-1">在手机中打开微信应用</p>
                    </div>
                  </div>
                  <div class="flex items-start">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <span class="text-blue-600 font-bold">2</span>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">扫码支付</p>
                      <p class="text-sm text-gray-600 mt-1">使用微信扫描上方二维码</p>
                    </div>
                  </div>
                  <div class="flex items-start">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <span class="text-blue-600 font-bold">3</span>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">确认支付</p>
                      <p class="text-sm text-gray-600 mt-1">输入支付密码完成支付</p>
                    </div>
                  </div>
                  <div class="flex items-start">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <span class="text-blue-600 font-bold">4</span>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">自动跳转</p>
                      <p class="text-sm text-gray-600 mt-1">支付成功后自动返回</p>
                    </div>
                  </div>
                </div>

                <!-- 支付提示 -->
                <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div class="flex">
                    <el-icon class="text-blue-500 mr-3">
                      <InfoFilled />
                    </el-icon>
                    <div>
                      <p class="text-sm font-medium text-blue-900">支付提示</p>
                      <p class="text-xs text-blue-700 mt-1">
                        • 请勿刷新或关闭本页面<br>
                        • 支付成功后自动跳转到资源页面<br>
                        • 如有问题请联系客服
                      </p>
                    </div>
                  </div>
                </div>

                <!-- 测试支付按钮（开发环境） -->
                <div v-if="isDevelopment" class="mt-6">
                  <el-button
                    type="warning"
                    size="large"
                    @click="simulatePayment"
                    class="w-full"
                  >
                    模拟支付成功（开发环境）
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 支付成功后的资源链接 -->
        <div v-if="order.payment_status === 'paid' || order.payment_status === 'completed'" class="p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">资源下载</h2>
          <div class="bg-green-50 border border-green-200 rounded-lg p-6">
            <div class="flex items-center mb-4">
              <el-icon class="text-green-500 text-2xl mr-3">
                <SuccessFilled />
              </el-icon>
              <div>
                <h3 class="text-lg font-semibold text-green-900">支付成功！</h3>
                <p class="text-sm text-green-700 mt-1">
                  您已成功购买该资源，现在可以下载了
                </p>
              </div>
            </div>

            <!-- 资源链接 -->
            <div class="bg-white rounded-lg p-4 border border-green-100">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <el-icon class="text-green-500 mr-3">
                    <Link />
                  </el-icon>
                  <div>
                    <p class="font-medium text-gray-900">网盘资源地址</p>
                    <p v-if="order.resource_url" class="text-sm text-gray-600 mt-1">
                      {{ order.resource_url }}
                    </p>
                    <p v-else class="text-sm text-gray-600 mt-1">
                      资源链接加载中...
                    </p>
                  </div>
                </div>
                <el-button
                  type="success"
                  @click="downloadResource"
                  :loading="downloading"
                  :disabled="!order.resource_url"
                >
                  <el-icon class="mr-2">
                    <Download />
                  </el-icon>
                  立即下载
                </el-button>
              </div>
            </div>

            <!-- 使用提示 -->
            <div class="mt-4 text-sm text-green-700">
              <p>• 点击"立即下载"按钮将直接跳转到网盘页面</p>
              <p class="mt-1">• 您也可以在资源详情页面查看该链接</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-between">
        <el-button @click="goBack" size="large">
          返回
        </el-button>
        <div class="space-x-3">
          <el-button
            v-if="order.payment_status === 'pending'"
            type="info"
            size="large"
            @click="cancelOrder"
            :loading="cancelling"
          >
            取消订单
          </el-button>
          <el-button
            v-if="order.resource"
            type="primary"
            size="large"
            @click="viewResource"
          >
            查看资源
          </el-button>
        </div>
      </div>

      <!-- 支付状态轮询提示 -->
      <div
        v-if="order.payment_status === 'pending' && !pollingStopped"
        class="mt-6 text-center text-sm text-gray-500"
      >
        <el-icon class="is-loading mr-2">
          <Loading />
        </el-icon>
        正在轮询支付状态...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Loading,
  CircleCloseFilled,
  FolderOpened,
  SuccessFilled,
  InfoFilled,
  Link,
  Download,
  Refresh,
  Money,
  Clock,
  Check,
  Close
} from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { OrderService } from '../../services/orderService'
import { lantuzPayService } from '../../services/lantuzPayService'
import type { Order, PaymentChannel } from '../../types/resources'
import { OrderStatus, OrderStatusLabels, PaymentChannelLabels } from '../../types/resources'
import { ResourceCategoryLabels } from '../../types/resources'
import { CloudPlatformLabels } from '../../types/resources'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const order = ref<Order | null>(null)
const qrCodeUrl = ref('')
const loading = ref(false)
const error = ref('')
const loadingQRCode = ref(false)
const refreshingQRCode = ref(false)
const cancelling = ref(false)
const downloading = ref(false)
const countdown = ref(1800) // 30分钟，单位：秒
const pollingInterval = ref<ReturnType<typeof setTimeout> | null>(null)
const pollingStopped = ref(false)

// 计算属性
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isDevelopment = computed(() => import.meta.env.DEV)

const statusBannerClass = computed(() => {
  switch (order.value?.payment_status) {
    case 'paid':
    case 'completed':
      return 'bg-gradient-to-r from-green-500 to-green-600'
    case 'pending':
      return 'bg-gradient-to-r from-blue-500 to-blue-600'
    case 'cancelled':
      return 'bg-gradient-to-r from-gray-500 to-gray-600'
    case 'refunded':
      return 'bg-gradient-to-r from-purple-500 to-purple-600'
    default:
      return 'bg-gradient-to-r from-gray-500 to-gray-600'
  }
})

const statusIcon = computed(() => {
  switch (order.value?.payment_status) {
    case 'paid':
    case 'completed':
      return Check
    case 'pending':
      return Clock
    case 'cancelled':
      return Close
    case 'refunded':
      return Money
    default:
      return Money
  }
})

const countdownClass = computed(() => {
  if (countdown.value > 300) return 'text-green-600 font-bold'
  if (countdown.value > 60) return 'text-orange-600 font-bold'
  return 'text-red-600 font-bold'
})

// 生命周期
onMounted(() => {
  if (!isAuthenticated.value) {
    router.push({
      name: 'Login',
      query: { redirect: router.currentRoute.value.fullPath }
    })
  } else {
    loadOrder()
  }
})

onUnmounted(() => {
  stopPolling()
})

// 方法
const loadOrder = async () => {
  const orderId = route.params.id as string
  if (!orderId) {
    error.value = '订单ID不存在'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const userId = authStore.user?.id
    if (!userId) {
      throw new Error('用户未登录')
    }

    const loadedOrder = await OrderService.getOrder(orderId, userId)

    if (!loadedOrder) {
      error.value = '订单不存在'
      return
    }

    order.value = loadedOrder

    // 如果是待支付状态，检查是否已过期
    if (loadedOrder.payment_status === 'pending') {
      const isExpired = await OrderService.checkOrderExpired(loadedOrder.id)
      if (isExpired) {
        // 订单已过期，更新状态
        await OrderService.updatePaymentStatus(
          loadedOrder.id,
          OrderStatus.CANCELLED,
          undefined,
          undefined,
          undefined
        )
        ElMessage.warning('订单已过期')
        // 重新加载订单信息（状态已更新）
        order.value = await OrderService.getOrder(orderId, userId)
        return
      }

      // 订单未过期，加载二维码并开始轮询
      await loadQRCode()
      startPolling()
      startCountdown()
    }
  } catch (err: any) {
    console.error('Error loading order:', err)
    error.value = err.message || '加载订单失败'
  } finally {
    loading.value = false
  }
}

const loadQRCode = async () => {
  if (!order.value) return

  loadingQRCode.value = true
  qrCodeUrl.value = ''
  try {
    const result = await lantuzPayService.createNativePayment(order.value)
    if (result.qr_code_url) {
      qrCodeUrl.value = result.qr_code_url
    } else {
      throw new Error('未获取到支付二维码')
    }
  } catch (err: any) {
    console.error('Error loading QR code:', err)
    ElMessage.error(err.message || '加载支付二维码失败，请稍后重试')
  } finally {
    loadingQRCode.value = false
  }
}

const refreshQRCode = async () => {
  refreshingQRCode.value = true
  try {
    await loadQRCode()
    ElMessage.success('二维码已刷新')
  } catch (err) {
    console.error('Error refreshing QR code:', err)
  } finally {
    refreshingQRCode.value = false
  }
}

const startPolling = () => {
  if (pollingInterval.value) return

  pollingInterval.value = setInterval(async () => {
    if (!order.value) return

    try {
      const result = await lantuzPayService.queryOrder(order.value.order_no)

      if (result.pay_status === 1) {
        // 支付成功，更新订单状态
        await OrderService.updatePaymentStatus(
          order.value.id,
          OrderStatus.PAID,
          order.value.order_no,
          result.pay_no,
          result.success_time
        )

        ElMessage.success('支付成功！')
        stopPolling()
        await loadOrder() // 重新加载订单信息
      }
    } catch (err: any) {
      console.error('Error polling order status:', err)
      // 如果是限流错误，暂停轮询一段时间
      if (err.message?.includes('降低请求接口频率')) {
        stopPolling()
        // 30秒后重新开始轮询
        setTimeout(() => {
          if (!pollingStopped.value) {
            startPolling()
          }
        }, 30000)
      }
    }
  }, 10000) // 10秒轮询一次，避免限流
}

const stopPolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
    pollingStopped.value = true
  }
}

const startCountdown = () => {
  if (!order.value) return

  const expiresAt = new Date(order.value.expires_at).getTime()
  const now = Date.now()
  const remainingTime = Math.max(0, Math.floor((expiresAt - now) / 1000))

  countdown.value = remainingTime

  // 如果剩余时间已经为0，立即检查过期状态
  if (remainingTime <= 0) {
    checkOrderExpired()
    return
  }

  const timer = setInterval(() => {
    if (countdown.value <= 0) {
      clearInterval(timer)
      // 检查订单是否过期
      checkOrderExpired()
      return
    }
    countdown.value--
  }, 1000)
}

const checkOrderExpired = async () => {
  if (!order.value) return

  try {
    const isExpired = await OrderService.checkOrderExpired(order.value.id)
    if (isExpired) {
      ElMessage.warning('订单已过期')
      stopPolling()
      await loadOrder() // 重新加载订单信息
    }
  } catch (err) {
    console.error('Error checking order expiration:', err)
  }
}

const getStatusText = (status?: OrderStatus) => {
  return OrderStatusLabels[status || OrderStatus.PENDING]
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

const getResourceTitle = (order: Order) => {
  return order.purchase_snapshot?.resource_title || order.resource?.title || order.resource_title || '资源已下架'
}

const getResourceDescription = (order: Order) => {
  return order.purchase_snapshot?.description || order.resource?.description
}

const getResourceCoverUrl = (order: Order) => {
  return order.purchase_snapshot?.cover_url || order.resource?.cover_url
}

const getResourceCategory = (order: Order) => {
  return order.purchase_snapshot?.category || order.resource?.category
}

const getResourcePlatform = (order: Order) => {
  return order.purchase_snapshot?.platform || order.resource?.platform
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
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

const simulatePayment = async () => {
  if (!order.value) return

  try {
    await OrderService.updatePaymentStatus(
      order.value.id,
      OrderStatus.PAID,
      order.value.order_no,
      'SIM' + Date.now(),
      new Date().toISOString()
    )

    ElMessage.success('模拟支付成功！')
    stopPolling()
    await loadOrder()
  } catch (err: any) {
    console.error('Error simulating payment:', err)
    ElMessage.error(err.message || '模拟支付失败')
  }
}

const cancelOrder = async () => {
  if (!order.value) return

  ElMessageBox.confirm(
    '确定要取消此订单吗？取消后无法恢复。',
    '取消订单确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '再想想',
      type: 'warning'
    }
  ).then(async () => {
    cancelling.value = true
    try {
      const userId = authStore.user?.id
      if (!userId) throw new Error('用户未登录')

      if (!order.value) throw new Error('订单不存在')
      await OrderService.cancelOrder(order.value.id, userId)
      ElMessage.success('订单已取消')
      stopPolling()
      await loadOrder()
    } catch (err: any) {
      console.error('Error cancelling order:', err)
      ElMessage.error(err.message || '取消订单失败')
    } finally {
      cancelling.value = false
    }
  }).catch(() => {
    // 用户点击了取消
  })
}

const downloadResource = async () => {
  if (!order.value || !order.value.resource_url) return

  downloading.value = true
  try {
    window.open(order.value.resource_url, '_blank')
  } catch (err) {
    console.error('Error downloading resource:', err)
    ElMessage.error('打开资源链接失败')
  } finally {
    downloading.value = false
  }
}

const viewResource = () => {
  if (!order.value || !order.value.resource) return
  router.push(`/resources/${order.value.resource.id}`)
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

/* 状态横幅动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.bg-gradient-to-r {
  animation: pulse 2s ease-in-out infinite;
}
</style>
