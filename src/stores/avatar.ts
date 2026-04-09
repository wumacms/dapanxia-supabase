import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../utils/supabase'

export const useAvatarStore = defineStore('avatar', () => {
  const avatarUrl = ref<string | null>(null)
  const avatarVersion = ref(0) // 用于缓存破坏
  const uploading = ref(false)
  const error = ref<string | null>(null)

  // 获取带版本参数的完整 URL
  function getAvatarUrlWithVersion(baseUrl: string | null): string | null {
    if (!baseUrl) return null
    const v = avatarVersion.value || Date.now()
    return `${baseUrl}?v=${v}`
  }

  // 从用户元数据获取头像
  async function fetchAvatar(userId: string) {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError
      avatarUrl.value = data?.avatar_url || null
      // 从 URL 中提取时间戳作为版本号，如果 URL 包含 v 参数
      if (data?.avatar_url) {
        const match = data.avatar_url.match(/[?&]v=(\d+)/)
        if (match) {
          avatarVersion.value = parseInt(match[1])
        }
      }
    } catch (e) {
      console.error('获取头像失败:', e)
    }
  }

  // 上传头像到 Supabase Storage
  async function uploadAvatar(userId: string, file: File) {
    uploading.value = true
    error.value = null

    try {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('只支持 JPG、PNG、GIF、WebP 格式的图片')
      }

      // 验证文件大小 (最大 2MB)
      const maxSize = 2 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error('图片大小不能超过 2MB')
      }

      // 生成文件名: userId/avatar.ext
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${userId}/avatar.${fileExt}`

      // 上传到 Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true, // 如果已存在则覆盖
          contentType: file.type,
        })

      if (uploadError) {
        // 如果上传失败可能是 bucket 不存在，尝试创建
        if (uploadError.message.includes('not found') || uploadError.message.includes('doesn\'t exist')) {
          await createBucketAndUpload(userId, file, fileName)
          return
        }
        throw uploadError
      }

      // 获取公开 URL
      await updateAvatarUrl(userId, fileName)
    } catch (e: any) {
      error.value = e.message || '上传失败'
      throw e
    } finally {
      uploading.value = false
    }
  }

  // 创建 bucket 并上传
  async function createBucketAndUpload(userId: string, file: File, fileName: string) {
    try {
      // 创建 public bucket
      const { error: bucketError } = await supabase.storage.createBucket('avatars', {
        public: true,
      })

      if (bucketError && !bucketError.message.includes('already exists')) {
        throw bucketError
      }

      // 重新上传
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      await updateAvatarUrl(userId, fileName)
    } catch (e: any) {
      error.value = e.message || '创建存储桶失败'
      throw e
    }
  }

  // 获取公开 URL 并更新到 profiles 表
  async function updateAvatarUrl(userId: string, fileName: string) {
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)

    if (data.publicUrl) {
      // 添加时间戳参数破坏缓存
      const timestamp = Date.now()
      avatarVersion.value = timestamp
      const urlWithVersion = `${data.publicUrl}?v=${timestamp}`

      avatarUrl.value = urlWithVersion

      // profiles 表存储不带版本参数的原始 URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString(),
        })

      if (updateError) {
        console.error('更新头像URL失败:', updateError)
      }
    }
  }

  // 删除头像
  async function deleteAvatar(userId: string) {
    uploading.value = true
    error.value = null

    try {
      const fileName = `${userId}/avatar.jpg`

      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([fileName])

      if (deleteError) throw deleteError

      // 清除 profiles 表中的 avatar_url
      await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', userId)

      avatarUrl.value = null
    } catch (e: any) {
      error.value = e.message || '删除失败'
      throw e
    } finally {
      uploading.value = false
    }
  }

  return {
    avatarUrl,
    avatarVersion,
    uploading,
    error,
    fetchAvatar,
    uploadAvatar,
    deleteAvatar,
    getAvatarUrlWithVersion,
  }
})
