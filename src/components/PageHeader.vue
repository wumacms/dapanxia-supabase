<template>
  <div class="page-header mb-8">
    <!-- 面包屑导航 -->
    <div v-if="breadcrumbs && breadcrumbs.length > 0" class="mb-6">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item 
          v-for="(item, index) in breadcrumbs" 
          :key="index" 
          :to="item.to"
        >
          {{ item.label }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 标题区域 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex-1">
        <h1 class="text-3xl font-bold text-gray-900">{{ title }}</h1>
        <p v-if="description" class="mt-2 text-gray-500">{{ description }}</p>
      </div>
      
      <!-- 右侧插槽，用于放置操作按钮 -->
      <div v-if="$slots.extra" class="flex items-center space-x-3">
        <slot name="extra" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface BreadcrumbItem {
  label: string
  to?: string | object
}

defineProps<{
  title?: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
}>()
</script>

<style scoped>
.page-header h1 {
  line-height: 1.2;
}
</style>
