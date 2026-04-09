<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { Camera, Loading } from '@element-plus/icons-vue'
import { useAvatarStore } from '../stores/avatar'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{
  size?: number
  editable?: boolean
}>()

const emit = defineEmits<{
  uploaded: [url: string]
}>()

const avatarStore = useAvatarStore()
const authStore = useAuthStore()

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const isUploading = ref(false)

const displayUrl = computed(() => {
  if (previewUrl.value) return previewUrl.value
  if (avatarStore.avatarUrl) return avatarStore.avatarUrl
  return null
})

const initials = computed(() => {
  const email = authStore.userEmail
  if (!email) return '?'
  return email.charAt(0).toUpperCase()
})

// 监听用户变化，加载头像
watch(
  () => authStore.user?.id,
  async (userId) => {
    if (userId) {
      await avatarStore.fetchAvatar(userId)
    }
  },
  { immediate: true }
)

const triggerFileInput = () => {
  if (props.editable && fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // 预览图片
    const reader = new FileReader()
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // 上传
    uploadFile(file)
  }

  // 重置 input
  target.value = ''
}

const uploadFile = async (file: File) => {
  if (!authStore.user?.id) {
    ElMessage.error('请先登录')
    return
  }

  isUploading.value = true
  const loading = ElLoading.service({
    lock: true,
    text: '上传中...',
    background: 'rgba(0, 0, 0, 0.7)',
  })

  try {
    await avatarStore.uploadAvatar(authStore.user.id, file)
    ElMessage.success('头像上传成功')
    emit('uploaded', avatarStore.avatarUrl!)

    // 清除预览
    previewUrl.value = null
  } catch (e: any) {
    ElMessage.error(e.message || '上传失败')
    previewUrl.value = null
  } finally {
    isUploading.value = false
    loading.close()
  }
}

const handleError = () => {
  // 图片加载失败时显示默认头像
  if (avatarStore.avatarUrl) {
    avatarStore.avatarUrl = ''
  }
}
</script>

<template>
  <div class="avatar-uploader" :class="{ editable }">
    <el-avatar
      v-if="displayUrl"
      :src="displayUrl"
      :size="size || 80"
      @error="handleError"
      class="avatar-img"
      @click="triggerFileInput"
    />
    <el-avatar v-else :size="size || 80" class="avatar-initials" @click="triggerFileInput">
      {{ initials }}
    </el-avatar>

    <!-- 上传中遮罩 -->
    <div v-if="isUploading" class="upload-overlay" :style="{ width: `${size || 80}px`, height: `${size || 80}px` }">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
    </div>

    <!-- 编辑按钮 -->
    <div v-if="editable && !isUploading" class="edit-overlay" :style="{ width: `${size || 80}px`, height: `${size || 80}px` }">
      <el-icon><Camera /></el-icon>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      class="hidden-input"
      @change="handleFileChange"
    />
  </div>
</template>

<style scoped>
.avatar-uploader {
  position: relative;
  display: inline-block;
}

.avatar-uploader.editable .avatar-img,
.avatar-uploader.editable .avatar-initials {
  cursor: pointer;
  transition: filter 0.3s;
}

.avatar-uploader.editable:hover .avatar-img,
.avatar-uploader.editable:hover .avatar-initials {
  filter: brightness(0.7);
}

.edit-overlay {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  color: white;
  font-size: 24px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 10;
}

.avatar-uploader.editable:hover .edit-overlay {
  opacity: 1;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  color: white;
  font-size: 24px;
}

.hidden-input {
  display: none;
}
</style>
