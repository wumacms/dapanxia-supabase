<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { getErrorMessage } from '../utils/i18n'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' },
  ],
}

const handleLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await authStore.signIn(form.email, form.password)
      ElMessage.success('登录成功！')
      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    } catch (error: any) {
      ElMessage.error(getErrorMessage(error))
    } finally {
      loading.value = false
    }
  })
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">欢迎回来</h1>
        <p class="text-gray-500">登录您的账户以继续</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent="handleLogin(formRef)"
      >
        <el-form-item prop="email" label="邮箱">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password" label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item class="mt-6">
          <el-button
            type="primary"
            class="w-full"
            :loading="loading"
            native-type="submit"
            @click="handleLogin(formRef)"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="text-center mt-6">
        <span class="text-gray-500">还没有账户？</span>
        <el-button type="primary" link @click="goToRegister">
          立即注册
        </el-button>
      </div>
    </div>
  </div>
</template>
