<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: string | number
  icon: any
  type?: 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'red'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'blue'
})

// 根据类型计算样式类
const typeClasses = computed(() => {
  const map = {
    blue: {
      border: 'border-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    green: {
      border: 'border-green-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    yellow: {
      border: 'border-yellow-500',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    purple: {
      border: 'border-purple-500',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    orange: {
      border: 'border-orange-500',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    red: {
      border: 'border-red-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    }
  }
  return map[props.type] || map.blue
})
</script>

<template>
  <div 
    class="bg-white rounded-xl p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
  >
    <div class="flex items-center justify-between">
      <div>
        <p class="text-gray-500 text-sm">{{ title }}</p>
        <p class="text-3xl font-bold text-gray-900 mt-2">{{ value }}</p>
      </div>
      <div 
        class="w-12 h-12 rounded-xl flex items-center justify-center"
        :class="typeClasses.iconBg"
      >
        <el-icon 
          class="text-2xl"
          :class="typeClasses.iconColor"
        >
          <component :is="icon" />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shadow-card {
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
}

.hover\:shadow-card-hover:hover {
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
}
</style>
