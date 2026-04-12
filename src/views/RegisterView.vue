<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Lock, Message } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { getErrorMessage } from '../utils/i18n'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
})

// 密码复杂度验证规则
const validatePassword = (_rule: any, value: string, callback: any) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

  if (!value) {
    callback(new Error('请输入密码'))
  } else if (!regex.test(value)) {
    callback(new Error('密码需≥8位，包含大小写字母、数字和特殊字符'))
  } else {
    callback()
  }
}

// 密码强度计算
const passwordStrength = computed(() => {
  const pwd = form.password
  if (!pwd) return { level: 0, text: '', color: '' }
  
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score++
  
  if (score <= 2) return { level: 1, text: '弱', color: 'bg-red-500' }
  if (score <= 4) return { level: 2, text: '中等', color: 'bg-yellow-500' }
  return { level: 3, text: '强', color: 'bg-green-500' }
})

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const handleRegister = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const result = await authStore.signUp(form.email, form.password)
      
      if (result.alreadyRegistered) {
        ElMessage.info('该邮箱已注册，验证邮件已发送至您的邮箱，请查收。')
        router.push('/login')
      } else {
        ElMessage.success('注册成功！请查收验证邮件完成激活。')
        router.push('/login')
      }
    } catch (error: any) {
      // 处理邮件发送频率限制错误
      if (error.code === 'over_email_send_rate_limit') {
        ElMessage.warning('该邮箱已注册，请查收之前的验证邮件，或稍后重试。')
        router.push('/login')
      } else {
        ElMessage.error(getErrorMessage(error))
      }
    } finally {
      loading.value = false
    }
  })
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-purple-600">
    <div class="w-full max-w-md bg-white rounded-2xl p-10 shadow-2xl">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <el-icon class="text-white text-3xl">
            <Folder />
          </el-icon>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">注册大盘虾</h1>
        <p class="text-gray-500">注册以开始使用</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent="handleRegister(formRef)"
      >
        <el-form-item prop="email" label="邮箱">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱"
            :prefix-icon="Message"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password" label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（至少8位，包含大小写字母、数字和特殊字符）"
            :prefix-icon="Lock"
            show-password
          />
          <!-- 密码强度指示器 -->
          <div v-if="form.password" class="mt-2">
            <div class="flex gap-1 mb-1">
              <div 
                v-for="i in 3" :key="i"
                class="h-1 flex-1 rounded-full transition-all duration-300"
                :class="i <= passwordStrength.level ? passwordStrength.color : 'bg-gray-200'"
              />
            </div>
            <p class="text-xs" :class="{
              'text-red-500': passwordStrength.level === 1,
              'text-yellow-500': passwordStrength.level === 2,
              'text-green-500': passwordStrength.level === 3,
            }">
              密码强度：{{ passwordStrength.text }}（需包含：大写字母、小写字母、数字、特殊字符）
            </p>
          </div>
        </el-form-item>

        <el-form-item prop="confirmPassword" label="确认密码">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item class="mt-6">
          <el-button
            type="primary"
            class="w-full !h-12 !text-base"
            :loading="loading"
            native-type="submit"
          >
            {{ loading ? '注册中...' : '注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="text-center mt-6">
        <span class="text-gray-500">已有账户？</span>
        <el-button type="primary" link @click="goToLogin">
          立即登录
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Folder } from '@element-plus/icons-vue'
export { Folder }
</script>
