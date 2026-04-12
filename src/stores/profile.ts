import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../utils/supabase'

export interface Profile {
  id: string
  nickname: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const loading = ref(false)

  // 获取用户资料
  async function fetchProfile(userId: string) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      profile.value = data as Profile
      return data
    } finally {
      loading.value = false
    }
  }

  // 更新昵称
  async function updateNickname(userId: string, nickname: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ nickname, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    profile.value = data as Profile
    return data
  }

  // 更新头像 URL（内部使用，由 avatar store 调用）
  async function updateAvatarUrl(userId: string, avatarUrl: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    profile.value = data as Profile
    return data
  }

  // 获取默认头像（使用 placehold.co，基于昵称首字母）
  function getDefaultAvatar(nickname: string): string {
    const initials = nickname.substring(0, 2).toUpperCase()
    return `https://placehold.co/200x200/6366f1/ffffff?text=${initials}`
  }

  return {
    profile,
    loading,
    fetchProfile,
    updateNickname,
    updateAvatarUrl,
    getDefaultAvatar,
  }
})
