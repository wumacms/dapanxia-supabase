/**
 * 表单验证工具函数
 */

// 密码正则：至少8位，包含大小写字母、数字和特殊字符
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

/**
 * 密码复杂度验证
 */
export const validatePassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (!PASSWORD_REGEX.test(value)) {
    callback(new Error('密码需≥8位，包含大小写字母、数字和特殊字符'))
  } else {
    callback()
  }
}

/**
 * 密码确认验证
 */
export const validateConfirmPassword = (passwordField: () => string) => {
  return (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error('请再次输入密码'))
    } else if (value !== passwordField()) {
      callback(new Error('两次输入的密码不一致'))
    } else {
      callback()
    }
  }
}

/**
 * 密码强度计算
 */
export interface PasswordStrength {
  level: number  // 0: 无, 1: 弱, 2: 中等, 3: 强
  text: string
  color: string
}

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) return { level: 0, text: '', color: '' }

  let count = 0
  if (password.length >= 8) count++
  if (/[A-Z]/.test(password)) count++
  if (/[a-z]/.test(password)) count++
  if (/[0-9]/.test(password)) count++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) count++

  // 满足所有5个条件为强
  if (count === 5) {
    return { level: 3, text: '强', color: 'bg-green-500' }
  }
  // 满足4个条件为中等
  if (count === 4) {
    return { level: 2, text: '中等', color: 'bg-orange-500' }
  }
  // 其他为弱
  return { level: 1, text: '弱', color: 'bg-red-500' }
}
