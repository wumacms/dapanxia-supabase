import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../utils/supabase'

// signUp 返回值类型
interface SignUpData {
  user: User | null
  session: Session | null
  alreadyRegistered?: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '')

  async function initAuth() {
    loading.value = true
    try {
      // 5秒超时处理
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 5000)
      )
      
      // 优先使用 getSession
      const authPromise = supabase.auth.getSession()
      
      const result = await Promise.race([authPromise, timeoutPromise]) as any
      const session = result?.data?.session
      user.value = session?.user ?? null

      // 设置监听，后续状态变化自动更新
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null
      })
    } catch (err) {
      console.error('Auth initialization failed or timed out:', err)
      // 如果初始化失败，也尝试设置监听以备后用
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null
      })
    } finally {
      loading.value = false
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    user.value = data.user
    return data
  }

  async function signUp(email: string, password: string): Promise<SignUpData> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    
    // 如果 session 为 null，说明邮箱已注册但未验证
    if (!data.session && data.user && !data.user.email_confirmed_at) {
      return { ...data, alreadyRegistered: true }
    }
    
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
  }

  async function updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
    user.value = data.user
    return data
  }

  return {
    user,
    loading,
    isAuthenticated,
    userEmail,
    initAuth,
    signIn,
    signUp,
    signOut,
    updatePassword,
  }
})
