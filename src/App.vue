<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import AppNavbar from './components/AppNavbar.vue'

const route = useRoute()

// 判断当前页面是否为认证页面（登录/注册/修改密码）
const isAuthPage = computed(() => {
  const authRoutes = ['Login', 'Register', 'ChangePassword']
  return authRoutes.includes(route.name as string)
})

// 判断是否需要显示导航栏
const showNavbar = computed(() => {
  // 认证页面不显示导航栏
  return !isAuthPage.value
})
</script>

<template>
  <div class="min-h-screen">
    <!-- 导航栏 -->
    <AppNavbar v-if="showNavbar" />
    
    <!-- 主内容区 -->
    <main :class="[
      'min-h-screen',
      showNavbar ? 'min-h-[calc(100vh-64px)] bg-gray-50' : ''
    ]">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* 移动端适配 */
@media (max-width: 768px) {
  main {
    padding-bottom: 80px;
  }
}
</style>
