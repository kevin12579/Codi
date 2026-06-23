import { test, expect } from '@playwright/test';

// 플레이스홀더 스모크 테스트.
// 프론트엔드 팀의 실제 화면(로그인/대시보드 등)이 연결되면 시나리오를 확장한다.
test('홈 페이지가 로드된다', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});
