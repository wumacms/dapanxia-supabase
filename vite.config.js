import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: import.meta.env.VITE_APP_BASE_PATH || '/dapanxia-supabase/',
  plugins: [vue(), tailwindcss()],
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
})
