import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// 自定义插件：将 index.html 复制为 404.html，用于 SPA fallback
const copyIndexTo404Plugin = () => ({
  name: 'copy-index-to-404',
  closeBundle() {
    const indexPath = path.resolve('dist/index.html')
    const targetPath = path.resolve('dist/404.html')
    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, targetPath)
    }
  }
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_APP_BASE_PATH,
    plugins: [vue(), tailwindcss(), copyIndexTo404Plugin()],
    server: {
      proxy: {
        // 代理支付 API 请求，解决 CORS 问题
        '/api/wxpay': {
          target: 'https://api.ltzf.cn/api',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        }
      }
    }
  }
})
