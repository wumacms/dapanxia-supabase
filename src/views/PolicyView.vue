<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownRenderer from '../components/MarkdownRenderer.vue'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const content = ref('')
const loading = ref(true)
const title = ref('')

const fetchPolicy = async (type: string) => {
  loading.value = true
  try {
    const filename = type === 'user-agreement' ? 'user-agreement.md' : 'privacy-policy.md'
    title.value = type === 'user-agreement' ? '用户协议' : '隐私政策'
    
    const response = await fetch(`/docs/${filename}`)
    if (!response.ok) throw new Error('无法加载文档')
    content.value = await response.text()
  } catch (error) {
    console.error('Failed to fetch policy:', error)
    content.value = '# 加载失败\n抱歉，无法加载该文档。'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const type = route.params.type as string
  fetchPolicy(type)
})

watch(() => route.params.type, (newType) => {
  if (newType) {
    fetchPolicy(newType as string)
  }
})

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/register')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
      <!-- Header -->
      <div class="bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
        <div class="flex items-center">
          <el-button 
            circle 
            :icon="ArrowLeft" 
            @click="goBack"
            class="mr-4 !border-none hover:!bg-gray-100"
          />
          <h1 class="text-2xl font-bold text-gray-900">{{ title }}</h1>
        </div>
        <div class="text-sm text-gray-400">最后更新：2024年4月24日</div>
      </div>

      <!-- Content -->
      <div class="px-8 py-10">
        <div v-if="loading" class="flex justify-center py-20">
          <el-skeleton :rows="10" animated />
        </div>
        <div v-else class="prose prose-indigo max-w-none">
          <MarkdownRenderer :content="content" />
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-8 py-6 border-t border-gray-100 text-center">
        <el-button type="primary" @click="goBack">返回</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose {
  max-width: 100%;
}
</style>
