<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { HomeFilled, Folder, List, UserFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import AvatarUploader from './AvatarUploader.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 控制个人中心抽屉
const drawer = ref(false)

// 计算属性
const isAuthenticated = computed(() => authStore.isAuthenticated)

// 导航菜单项
const navItems = [
  { name: 'Home', label: '首页', path: '/', icon: HomeFilled },
  { name: 'Resources', label: '资源库', path: '/resources', icon: Folder },
  { name: 'MyResources', label: '我的资源', path: '/my-resources', icon: Folder },
  { name: 'Orders', label: '我的订单', path: '/orders', icon: List },
]

// 判断当前路由是否激活
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

// 退出登录
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

// 跳转到个人中心
const goToProfile = () => {
  drawer.value = true
}

// 跳转到我的资源
const goToMyResources = () => {
  drawer.value = false
  router.push('/my-resources')
}

// 跳转到我的订单
const goToOrders = () => {
  drawer.value = false
  router.push('/orders')
}

// 跳转到修改密码
const goToChangePassword = () => {
  drawer.value = false
  router.push('/change-password')
}
</script>

<template>
  <nav class="app-navbar bg-white shadow-sm sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- 左侧：Logo 和导航链接 -->
        <div class="flex items-center">
          <!-- Logo -->
          <router-link to="/" class="flex items-center flex-shrink-0">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
              <el-icon class="text-white text-lg">
                <Folder />
              </el-icon>
            </div>
            <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              网盘资源库
            </span>
          </router-link>

          <!-- 导航链接 - 仅登录后显示 -->
          <div v-if="isAuthenticated" class="hidden md:flex items-center ml-8 space-x-1">
            <router-link
              v-for="item in navItems"
              :key="item.name"
              :to="item.path"
              class="nav-link px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
              :class="[
                isActive(item.path)
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              ]"
            >
              <el-icon class="mr-1.5">
                <component :is="item.icon" />
              </el-icon>
              {{ item.label }}
            </router-link>
          </div>
        </div>

        <!-- 右侧：操作按钮和用户信息 -->
        <div class="flex items-center space-x-4">
          <template v-if="isAuthenticated">
            <!-- 用户下拉菜单 -->
            <el-dropdown trigger="click" placement="bottom-end">
              <div class="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <AvatarUploader :size="36" />
                <div class="hidden sm:block">
                  <p class="text-sm font-medium text-gray-700">{{ authStore.userEmail }}</p>
                </div>
                <el-icon class="text-gray-400">
                  <UserFilled />
                </el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="w-48">
                  <el-dropdown-item @click="goToProfile">
                    <el-icon class="mr-2"><UserFilled /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item @click="goToMyResources">
                    <el-icon class="mr-2"><Folder /></el-icon>
                    我的资源
                  </el-dropdown-item>
                  <el-dropdown-item @click="goToOrders">
                    <el-icon class="mr-2"><List /></el-icon>
                    我的订单
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="goToChangePassword">
                    <el-icon class="mr-2"><UserFilled /></el-icon>
                    修改密码
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout" class="text-red-500">
                    <el-icon class="mr-2"><UserFilled /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>

          <!-- 未登录状态 -->
          <template v-else>
            <router-link to="/login">
              <el-button type="primary" size="small">登录</el-button>
            </router-link>
            <router-link to="/register" class="hidden sm:block">
              <el-button type="primary" plain size="small">注册</el-button>
            </router-link>
          </template>
        </div>
      </div>
    </div>

    <!-- 移动端导航栏 - 底部固定 -->
    <div v-if="isAuthenticated" class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div class="flex justify-around py-2">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          class="flex flex-col items-center py-2 px-4 rounded-lg"
          :class="[
            isActive(item.path)
              ? 'text-blue-600'
              : 'text-gray-500'
          ]"
        >
          <el-icon class="text-xl mb-1">
            <component :is="item.icon" />
          </el-icon>
          <span class="text-xs">{{ item.label }}</span>
        </router-link>
      </div>
    </div>
  </nav>

  <!-- 个人中心抽屉 -->
  <el-drawer
    v-model="drawer"
    title="个人中心"
    size="380"
    :with-header="true"
    class="profile-drawer"
  >
    <div class="p-6">
      <!-- 用户信息卡片 -->
      <div class="text-center mb-8">
        <div class="relative inline-block">
          <AvatarUploader :size="80" :editable="true" />
          <div class="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <el-icon class="text-white text-xs"><Check /></el-icon>
          </div>
        </div>
        <h3 class="mt-4 text-lg font-semibold text-gray-900">{{ authStore.userEmail }}</h3>
        <p class="text-gray-500 text-sm mt-1">普通用户</p>
      </div>

      <!-- 快捷操作 -->
      <div class="grid grid-cols-2 gap-3 mb-8">
        <el-button @click="goToMyResources" class="h-16 flex flex-col items-center justify-center">
          <el-icon class="text-xl mb-1"><Folder /></el-icon>
          <span class="text-sm">我的资源</span>
        </el-button>
        <el-button @click="goToOrders" class="h-16 flex flex-col items-center justify-center">
          <el-icon class="text-xl mb-1"><List /></el-icon>
          <span class="text-sm">我的订单</span>
        </el-button>
      </div>

      <!-- 账户信息 -->
      <div class="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 class="text-sm font-medium text-gray-700 mb-4">账户信息</h4>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">用户ID</span>
            <span class="text-gray-900 font-mono">{{ authStore.user?.id?.slice(0, 8) }}...</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">邮箱</span>
            <span class="text-gray-900">{{ authStore.userEmail }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500">邮箱验证</span>
            <el-tag
              :type="authStore.user?.email_confirmed_at ? 'success' : 'warning'"
              size="small"
            >
              {{ authStore.user?.email_confirmed_at ? '已验证' : '未验证' }}
            </el-tag>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">注册时间</span>
            <span class="text-gray-900">
              {{ new Date(authStore.user?.created_at || '').toLocaleDateString() }}
            </span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="space-y-3">
        <el-button type="primary" class="w-full" @click="goToChangePassword">
          修改密码
        </el-button>
        <el-button type="danger" plain class="w-full" @click="handleLogout">
          退出登录
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { Check } from '@element-plus/icons-vue'
export { Check }
</script>

<style scoped>
.app-navbar {
  border-bottom: 1px solid #e5e7eb;
}

.nav-link {
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.nav-link:hover::after {
  width: 60%;
}

/* 移动端底部导航占位 */
@media (max-width: 768px) {
  .app-navbar {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
