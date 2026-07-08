import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy dev trỏ tới BE ĐÃ DEPLOY trên Azure (khớp cấu hình của nhóm).
// api.js dùng URL tuyệt đối nên chủ yếu fetch thẳng; proxy giữ để phòng khi
// có code gọi đường dẫn tương đối /api hoặc /hubs.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://hrms-backend-a4dwfmgmgfagf7ax.southeastasia-01.azurewebsites.net',
        changeOrigin: true,
        secure: true,
      },
      '/hubs': {
        target: 'https://hrms-backend-a4dwfmgmgfagf7ax.southeastasia-01.azurewebsites.net',
        ws: true,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
