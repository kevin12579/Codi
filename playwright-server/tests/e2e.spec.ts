import { test, expect } from '@playwright/test';

// E2E 대상: demo-web (BASE_URL 로 주입됨, 기본 http://demo-web:80).
// Codi 파이프라인이 PR 마다 이 테스트를 playwright-server 에서 실행한다.

test('홈 페이지가 로드되고 제목이 노출된다', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Codi Demo Web/);
  await expect(page.getByTestId('title')).toHaveText('Codi Demo Web');
});

test('핵심 기능 항목이 모두 표시된다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('feat-review')).toBeVisible();
  await expect(page.getByTestId('feat-e2e')).toBeVisible();
  await expect(page.getByTestId('feat-deploy')).toBeVisible();
});

test('Ping 버튼을 누르면 결과가 pong 으로 바뀐다 (상호작용)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('result')).toHaveText('idle');
  await page.getByTestId('ping-btn').click();
  await expect(page.getByTestId('result')).toHaveText('pong');
});
