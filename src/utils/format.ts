/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  // 对于小于 1MB 的显示为 KB，不保留小数
  // 对于大于等于 1MB 的显示为 MB，保留两位小数（如果小数部分不为0）
  if (i <= 1) {
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i]
  }
  
  const val = bytes / Math.pow(k, i)
  return parseFloat(val.toFixed(2)) + ' ' + sizes[i]
}
