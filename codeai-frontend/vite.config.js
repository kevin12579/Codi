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
      // 1️⃣ /api 요청 우회 설정
      '/api': {
        target: 'https://outing-revisable-kitten.ngrok-free.dev', // https로 변경
        changeOrigin: true,
        secure: false, // SSL 인증서 검증 무시
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // 🔥 핵심: ngrok 프리 브라우저 경고 페이지 강제 스킵 헤더
            proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
          });
        },
      },
      // 2️⃣ /webhook 요청 우회 설정
      '/webhook': {
        target: 'https://outing-revisable-kitten.ngrok-free.dev', // https로 변경
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
          });
        },
      },
    },
  },
});