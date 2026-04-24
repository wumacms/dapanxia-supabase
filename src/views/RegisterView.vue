<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Lock, Message } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { getErrorMessage } from '../utils/i18n'
import { validatePassword, validateConfirmPassword, calculatePasswordStrength } from '../utils/validation'
import MarkdownRenderer from '../components/MarkdownRenderer.vue'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  agreed: false,
})

// 协议弹窗状态
const policyDialog = reactive({
  visible: false,
  title: '',
  content: '',
  loading: false
})

const showPolicy = async (type: 'user-agreement' | 'privacy-policy') => {
  policyDialog.title = type === 'user-agreement' ? '用户协议' : '隐私政策'
  policyDialog.visible = true
  policyDialog.loading = true
  
  try {
    const filename = type === 'user-agreement' ? 'user-agreement.md' : 'privacy-policy.md'
    const response = await fetch(`/docs/${filename}`)
    if (!response.ok) throw new Error('无法加载文档')
    policyDialog.content = await response.text()
  } catch (error) {
    console.error('Failed to fetch policy:', error)
    policyDialog.content = '# 加载失败\n抱歉，无法加载该文档。'
  } finally {
    policyDialog.loading = false
  }
}

// 密码强度计算
const passwordStrength = computed(() => calculatePasswordStrength(form.password))

const validateConfirmPwd = validateConfirmPassword(() => form.password)

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
    { validator: validateConfirmPwd, trigger: 'blur' },
  ],
}

const handleRegister = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (!valid) return

    if (!form.agreed) {
      ElMessage.warning('请先阅读并勾选用户协议和隐私政策')
      return
    }

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
        <router-link to="/">
          <img src="/logo.png" alt="盘大侠" class="h-12 w-auto mx-auto mb-6 object-contain cursor-pointer" />
        </router-link>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">用户注册</h1>
        <!-- <p class="text-gray-500">注册以开始使用</p> -->
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
              'text-orange-500': passwordStrength.level === 2,
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

        <el-form-item prop="agreed">
          <el-checkbox v-model="form.agreed">
            <span class="text-sm text-gray-500">
              我已阅读并同意<span class="text-primary-600 hover:text-primary-500 cursor-pointer transition-colors" @click.stop="showPolicy('user-agreement')">《用户协议》</span>和<span class="text-primary-600 hover:text-primary-500 cursor-pointer transition-colors" @click.stop="showPolicy('privacy-policy')">《隐私政策》</span>
            </span>
          </el-checkbox>
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

      <div class="text-center mt-6 flex flex-col items-center space-y-2">
        <div>
          <span class="text-gray-500">已有账户？</span>
          <el-button type="primary" link @click="goToLogin">
            立即登录
          </el-button>
        </div>
        <el-button type="info" link @click="router.push('/')" class="!text-gray-400 hover:!text-gray-600">
          返回首页
        </el-button>
      </div>
    </div>
  </div>

  <!-- 协议弹窗 -->
  <el-dialog
    v-model="policyDialog.visible"
    :title="policyDialog.title"
    width="80%"
    max-width="800px"
    append-to-body
    destroy-on-close
    class="policy-dialog"
  >
    <div v-if="policyDialog.loading" class="py-10">
      <el-skeleton :rows="10" animated />
    </div>
    <div v-else class="max-h-[60vh] overflow-y-auto pr-2">
      <MarkdownRenderer :content="policyDialog.content" />
    </div>
    <template #footer>
      <el-button type="primary" @click="policyDialog.visible = false">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
:deep(.policy-dialog) {
  border-radius: 1rem;
}
:deep(.policy-dialog .el-dialog__body) {
  padding-top: 10px;
}
</style>

<script lang="ts">
import { Folder } from '@element-plus/icons-vue'
export { Folder }
</script>
