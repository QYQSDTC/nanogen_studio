import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3008,
    host: true, // 允许外部访问
  },
  preview: {
    port: 3008,
    host: true, // 允许外部访问
    allowedHosts: [
      'banana.cpolar.cn',
      '.cpolar.cn', // 允许所有 cpolar.cn 子域名
    ],
  },
})

