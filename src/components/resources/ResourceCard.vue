<template>
  <div class="group resource-card" @click="emit('card-click', props.resource.id)">
    <!-- 封面图片 -->
    <div class="resource-cover relative h-48 overflow-hidden rounded-t-lg">
      <img
        v-if="resource.cover_url"
        :src="resource.cover_url"
        :alt="resource.title"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100"
      >
        <el-icon class="text-5xl text-gray-400">
          <FolderOpened />
        </el-icon>
      </div>
      
      <!-- 价格标签 -->
      <div class="absolute top-3 right-3">
        <span
          v-if="resource.is_free"
          class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
        >
          免费
        </span>
        <span
          v-else
          class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
        >
          ¥{{ resource.price }}
        </span>
      </div>

      <!-- 平台标签 -->
      <div class="absolute bottom-3 left-3">
        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white/90 text-gray-700">
          {{ platformLabel }}
        </span>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="resource-content p-4 bg-white">
      <!-- 标题 -->
      <h3 class="resource-title text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
        {{ resource.title }}
      </h3>

      <!-- 描述 -->
      <p class="resource-description text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.8rem]">
        {{ stripMarkdown(resource.description) }}
      </p>

      <!-- 分类标签 -->
      <div class="mb-3">
        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
          {{ categoryLabel }}
        </span>
      </div>

      <!-- 统计信息 -->
      <div class="resource-stats flex items-center justify-between text-xs text-gray-500">
        <div class="flex items-center space-x-4">
          <!-- 浏览量 -->
          <span class="flex items-center">
            <el-icon class="mr-1">
              <View />
            </el-icon>
            {{ formatNumber(resource.view_count) }}
          </span>
          
          <!-- 购买量 -->
          <span class="flex items-center">
            <el-icon class="mr-1">
              <ShoppingCart />
            </el-icon>
            {{ formatNumber(resource.purchase_count) }}
          </span>
        </div>

        <!-- 发布时间 -->
        <span class="text-xs text-gray-400">
          {{ formatTime(resource.created_at) }}
        </span>
      </div>

      <!-- 标签区域 -->
      <div v-if="resource.tags && resource.tags.length > 0" class="mt-3 flex flex-wrap gap-1">
        <span
          v-for="(tag, index) in resource.tags.slice(0, 3)"
          :key="index"
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
        >
          #{{ tag }}
        </span>
        <span
          v-if="resource.tags.length > 3"
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-400"
        >
          +{{ resource.tags.length - 3 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FolderOpened, View, ShoppingCart } from '@element-plus/icons-vue'
import type { Resource, ResourceCategory, CloudPlatform } from '../../types/resources'
import { ResourceCategoryLabels } from '../../types/resources'
import { CloudPlatformLabels } from '../../types/resources'

interface Props {
  resource: Resource
}

const props = defineProps<Props>()

// 计算属性
const categoryLabel = computed(() => {
  return ResourceCategoryLabels[props.resource.category as ResourceCategory] || '其他'
})

const platformLabel = computed(() => {
  return CloudPlatformLabels[props.resource.platform as CloudPlatform] || '其他'
})

// 方法
const stripMarkdown = (text: string): string => {
  return text
    .replace(/[#*_`\[\]()>]/g, '')  // 移除Markdown标记
    .replace(/\s+/g, ' ')           // 合并空格
    .trim()                         // 去除首尾空格
    .substring(0, 100)              // 截取前100个字符
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatTime = (timeString: string): string => {
  const time = new Date(timeString)
  const now = new Date()
  const diffMs = now.getTime() - time.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  
  if (diffHours < 1) {
    return '刚刚'
  } else if (diffHours < 24) {
    return `${Math.floor(diffHours)}小时前`
  } else if (diffHours < 24 * 7) {
    return `${Math.floor(diffHours / 24)}天前`
  } else {
    return time.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }
}

const emit = defineEmits<{
  (e: 'card-click', id: string): void
}>()
</script>

<style scoped>
/* 资源卡片样式 */
.resource-card {
  position: relative;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  cursor: pointer;
  transition: all 300ms;
}

.resource-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  border-color: transparent;
}

.resource-cover {
  transition: all 300ms;
}

.resource-card:hover .resource-cover {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

.resource-title {
  transition: color 300ms;
}

.resource-card:hover .resource-title {
  color: #2563eb;
}

.resource-content {
  transition: background-color 300ms;
}

.resource-card:hover .resource-content {
  background-color: #f9fafb;
}

/* 限制行数 */
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

/* 平滑过渡 */
img {
  transition: transform 0.5s ease;
}
</style>