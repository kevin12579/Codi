import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 기존의 @ 절대경로 유지
    },
  },
  server: {
    port: 5173,
    proxy: {
      // 대시보드 API는 로컬 백엔드에 직접 붙는다.
      // (ngrok 무료 터널 경유는 동시연결 제한·간헐 끊김으로 500 유발 → 대시보드에는 부적합.
      //  ngrok 은 GitHub 웹훅 인바운드용으로만 사용하고, 필요 시 아래 target 만 ngrok URL 로 교체.)
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/webhook': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});