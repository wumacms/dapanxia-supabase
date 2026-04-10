<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useAvatarStore } from '../stores/avatar'
import AvatarUploader from '../components/AvatarUploader.vue'

const router = useRouter()
const authStore = useAuthStore()
const avatarStore = useAvatarStore()
const drawer = ref(false)

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

const menuItems = [
  { title: '仪表盘', icon: '📊', color: 'bg-blue-500' },
  { title: '用户管理', icon: '👥', color: 'bg-green-500' },
  { title: '数据分析', icon: '📈', color: 'bg-orange-500' },
  { title: '系统设置', icon: '⚙️', color: 'bg-gray-500' },
]

const stats = [
  { label: '总用户数', value: '1,234', change: '+12%', up: true },
  { label: '活跃用户', value: '856', change: '+8%', up: true },
  { label: '总订单数', value: '5,678', change: '-3%', up: false },
  { label: '总收入', value: '¥98,765', change: '+15%', up: true },
]
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- 顶部导航 -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-blue-600">管理系统</h1>
          </div>
          <div class="flex items-center gap-4">
            <el-dropdown>
              <div class="flex items-center gap-2 cursor-pointer">
                <AvatarUploader :size="32" />
                <span class="text-gray-700 hidden sm:block">{{ authStore.userEmail }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="drawer = true">个人中心</el-dropdown-item>
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
        <p class="text-gray-500 mt-1">这是您的系统首页</p>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          v-for="(stat, index) in stats"
          :key="index"
          class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <p class="text-gray-500 text-sm">{{ stat.label }}</p>
          <p class="text-2xl font-bold text-gray-800 mt-2">{{ stat.value }}</p>
          <p :class="stat.up ? 'text-green-500' : 'text-red-500'" class="text-sm mt-1">
            {{ stat.change }} 相比上周
          </p>
        </div>
      </div>

      <!-- 功能菜单 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="(item, index) in menuItems"
          :key="index"
          class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1"
        >
          <div
            :class="item.color"
            class="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl mb-4"
          >
            {{ item.icon }}
          </div>
          <h3 class="font-medium text-gray-800">{{ item.title }}</h3>
          <p class="text-gray-400 text-sm mt-1">点击查看详情</p>
        </div>
      </div>
    </main>

    <!-- 个人中心抽屉 -->
    <el-drawer v-model="drawer" title="个人中心" size="400px">
      <div class="space-y-6">
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
