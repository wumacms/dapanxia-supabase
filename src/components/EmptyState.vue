<script setup>
import { computed } from 'vue'
import { Search, FolderOpened, CircleClose, Connection } from '@element-plus/icons-vue'

const props = defineProps({
  /**
   * 状态类型: 'data' (默认), 'search', 'error', 'network'
   */
  type: {
    type: String,
    default: 'data'
  },
  /**
   * 主标题
   */
  title: {
    type: String,
    default: ''
  },
  /**
   * 详细描述
   */
  description: {
    type: String,
    default: ''
  },
  /**
   * 图片尺寸
   */
  imageSize: {
    type: Number,
    default: 160
  },
  /**
   * 是否显示操作按钮
   */
  showAction: {
    type: Boolean,
    default: false
  },
  /**
   * 按钮文字
   */
  actionText: {
    type: String,
    default: '重试'
  }
})

const emit = defineEmits(['action'])

const config = computed(() => {
  const configs = {
    data: {
      title: '暂无数据',
      description: '这里空空如也，什么都没有发现',
      icon: FolderOpened,
      color: 'text-gray-400',
      bgColor: 'bg-gray-400'
    },
    search: {
      title: '未找到结果',
      description: '换个关键词试试，也许会有新发现',
      icon: Search,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400'
    },
    error: {
      title: '出错了',
      description: '加载数据时遇到了点麻烦，请稍后再试',
      icon: CircleClose,
      color: 'text-red-400',
      bgColor: 'bg-red-400'
    },
    network: {
      title: '网络连接异常',
      description: '请检查您的网络连接是否正常',
      icon: Connection,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400'
    }
  }
  
  const current = configs[props.type] || configs.data
  
  return {
    title: props.title || current.title,
    description: props.description || current.description,
    icon: current.icon,
    color: current.color,
    bgColor: current.bgColor
  }
})

const handleAction = () => {
  emit('action')
}
</script>

<template>
  <div class="empty-state-container flex flex-col items-center justify-center py-12 px-4">
    <el-empty
      :image-size="imageSize"
      class="premium-empty"
    >
      <template #image>
        <div class="icon-wrapper relative mb-6">
          <div 
            class="icon-bg absolute inset-0 blur-3xl opacity-20 rounded-full scale-150"
            :class="config.bgColor"
          ></div>
          <div class="relative z-10 flex items-center justify-center">
            <el-icon :size="imageSize / 2" :class="['premium-icon', config.color]">
              <component :is="config.icon" />
            </el-icon>
          </div>
        </div>
      </template>
      
      <template #description>
        <div class="text-center mt-4">
          <h3 class="text-xl font-bold text-gray-800 mb-2">{{ config.title }}</h3>
          <p class="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">{{ config.description }}</p>
        </div>
      </template>
      
      <div v-if="showAction || $slots.default" class="mt-8 flex justify-center">
        <slot>
          <el-button 
            type="primary" 
            size="large"
            round 
            class="px-10 py-3 font-medium shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-300"
            @click="handleAction"
          >
            {{ actionText }}
          </el-button>
        </slot>
      </div>
    </el-empty>
  </div>
</template>

<style scoped>
.empty-state-container {
  min-height: 400px;
  background-image: radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
}

.premium-empty :deep(.el-empty__image) {
  margin-bottom: 0;
}

.premium-empty :deep(.el-empty__description) {
  margin-top: 0;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.premium-icon {
  filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1));
}
</style>
