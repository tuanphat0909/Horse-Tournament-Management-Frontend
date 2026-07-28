import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy dev trỏ tới BE ĐÃ DEPLOY trên Azure (khớp cấu hình của nhóm).
// Có thể override bằng biến môi trường VITE_BACKEND_URL (file .env.local).
// api.js dùng URL tuyệt đối nên chủ yếu fetch thẳng; proxy giữ để phòng khi
// có code gọi đường dẫn tương đối /api hoặc /hubs.
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'https://hrms-backend-a4dwfmgmgfagf7ax.southeastasia-01.azurewebsites.net';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: true,
        },
        '/hubs': {
          target: backendUrl,
          ws: true,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
})
