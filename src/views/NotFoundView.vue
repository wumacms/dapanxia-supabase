<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, HomeFilled, Search } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-4">
    <div class="text-center">
      <!-- 404 大数字 -->
      <div class="mb-6">
        <span class="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-500 leading-none select-none">
          404
        </span>
      </div>

      <!-- 图标装饰 -->
      <div class="relative -mt-12 mb-4">
        <div class="w-24 h-24 mx-auto bg-white rounded-2xl shadow-card flex items-center justify-center">
          <el-icon class="text-5xl text-gray-300">
            <Search />
          </el-icon>
        </div>
      </div>

      <!-- 提示文字 -->
      <h1 class="text-2xl font-bold text-gray-800 mb-2">页面未找到</h1>
      <p class="text-gray-500 mb-8 max-w-md mx-auto">
        抱歉，您访问的页面不存在或已被移除。<br />
        可能的原因：链接错误、页面已删除或 URL 输入有误。
      </p>

      <!-- 操作按钮 -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <el-button type="primary" size="large" @click="goHome" class="min-w-[140px]">
          <el-icon class="mr-1"><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button size="large" @click="goBack" class="min-w-[140px]">
          <el-icon class="mr-1"><ArrowLeft /></el-icon>
          返回上页
        </el-button>
      </div>

      <!-- 装饰性背景 -->
      <div class="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div class="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div class="absolute bottom-20 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style="animation-delay: 1s;"></div>
      </div>
    </div>
  </div>
</template>
