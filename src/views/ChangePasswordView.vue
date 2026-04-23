<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { getErrorMessage } from '../utils/i18n'
import { validatePassword, validateConfirmPassword, calculatePasswordStrength } from '../utils/validation'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 密码强度计算
const passwordStrength = computed(() => calculatePasswordStrength(form.newPassword))

const validateConfirmPwd = validateConfirmPassword(() => form.newPassword)

const rules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPwd, trigger: 'blur' },
  ],
}

const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      // 验证当前密码
      await authStore.signIn(authStore.userEmail, form.currentPassword)
      // 更新密码
      await authStore.updatePassword(form.newPassword)
      ElMessage.success('密码修改成功！')
      router.push('/')
    } catch (error: any) {
      if (error.message?.includes('Invalid login credentials')) {
        ElMessage.error('当前密码错误')
      } else {
        ElMessage.error(getErrorMessage(error))
      }
    } finally {
      loading.value = false
    }
  })
}

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-purple-600">
    <div class="w-full max-w-md bg-white rounded-2xl p-10 shadow-2xl">
      <!-- Logo -->
      <div class="text-center mb-8">
        <img src="/logo.png" alt="盘大侠" class="h-12 w-auto mx-auto mb-4 object-contain" />
        <h1 class="text-2xl font-bold text-gray-900 mb-2">修改密码</h1>
        <!-- <p class="text-gray-500">请输入您的当前密码和新密码</p> -->
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
      >
        <el-form-item prop="currentPassword" label="当前密码">
          <el-input
            v-model="form.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item prop="newPassword" label="新密码">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码（至少8位，包含大小写字母、数字和特殊字符）"
            :prefix-icon="Lock"
            show-password
            clearable
          />
          <!-- 密码强度指示器 -->
          <div v-if="form.newPassword" class="mt-2">
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

        <el-form-item prop="confirmPassword" label="确认新密码">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item class="mt-6">
          <el-button
            type="primary"
            class="w-full !h-12 !text-base"
            :loading="loading"
            @click="handleSubmit(formRef)"
          >
            {{ loading ? '提交中...' : '确认修改' }}
          </el-button>
        </el-form-item>

        <el-form-item class="mb-0">
          <el-button class="w-full !h-12" @click="goBack">
            返回首页
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts">
import { Folder } from '@element-plus/icons-vue'
export { Folder }
</script>
