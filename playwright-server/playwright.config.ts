import { defineConfig } from '@playwright/test';

// 결과는 test-results.json 으로 출력 → server.js 가 읽어 파싱한다.
export default defineConfig({
  testDir: './tests',
  reporter: [['json', { outputFile: 'test-results.json' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
  },
  timeout: 30000,
});
