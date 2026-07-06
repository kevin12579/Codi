import { test, expect } from '@playwright/test';

// E2E 대상: demo-web(TaskBoard 샘플 앱). BASE_URL 로 주입됨(기본 http://demo-web:80).
// Codi 파이프라인이 PR 마다 이 시나리오들을 playwright-server 에서 실제 실행한다.
// "고객이 이미 가진 E2E 를 오케스트레이션한다"는 포지셔닝의 실증 데모.

const EMAIL = 'demo@codi.dev';
const PW = 'codi1234';

async function login(page) {
  await page.goto('/');
  await page.getByTestId('email').fill(EMAIL);
  await page.getByTestId('password').fill(PW);
  await page.getByTestId('login-btn').click();
  await expect(page.getByTestId('board-view')).toBeVisible();
}

test('로그인 화면이 렌더된다', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/TaskBoard/);
  await expect(page.getByTestId('login-view')).toBeVisible();
  await expect(page.getByTestId('board-view')).toBeHidden();
});

test('잘못된 비밀번호는 에러를 표시한다', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('email').fill(EMAIL);
  await page.getByTestId('password').fill('wrong-pass');
  await page.getByTestId('login-btn').click();
  await expect(page.getByTestId('login-error')).toBeVisible();
  await expect(page.getByTestId('board-view')).toBeHidden();
});

test('올바른 자격증명으로 로그인하면 보드로 진입한다', async ({ page }) => {
  await login(page);
  await expect(page.getByTestId('user-email')).toHaveText(EMAIL);
});

test('할 일을 추가하면 목록과 카운터가 갱신된다', async ({ page }) => {
  await login(page);
  await expect(page.getByTestId('empty-state')).toBeVisible();

  await page.getByTestId('task-input').fill('발표 자료 준비');
  await page.getByTestId('add-btn').click();
  await page.getByTestId('task-input').fill('데모 리허설');
  await page.getByTestId('add-btn').click();

  await expect(page.getByTestId('task-list').locator('li')).toHaveCount(2);
  await expect(page.getByTestId('remaining')).toHaveText('2개 남음');
});

test('빈 입력이면 추가 버튼이 비활성화된다 (검증)', async ({ page }) => {
  await login(page);
  await expect(page.getByTestId('add-btn')).toBeDisabled();
  await page.getByTestId('task-input').fill('x');
  await expect(page.getByTestId('add-btn')).toBeEnabled();
});

test('완료 체크 후 완료 필터에만 보인다', async ({ page }) => {
  await login(page);
  await page.getByTestId('task-input').fill('배포 승인 테스트');
  await page.getByTestId('add-btn').click();

  // 첫 번째 항목 완료 체크
  await page.getByTestId('task-list').locator('input[type=checkbox]').first().check();
  await expect(page.getByTestId('remaining')).toHaveText('0개 남음');

  // 진행중 필터 → 비어야 함
  await page.getByTestId('filter-active').click();
  await expect(page.getByTestId('task-list').locator('li')).toHaveCount(0);

  // 완료 필터 → 1개
  await page.getByTestId('filter-done').click();
  await expect(page.getByTestId('task-list').locator('li')).toHaveCount(1);
});

test('할 일을 삭제하면 목록에서 사라진다', async ({ page }) => {
  await login(page);
  await page.getByTestId('task-input').fill('삭제될 항목');
  await page.getByTestId('add-btn').click();
  await expect(page.getByTestId('task-list').locator('li')).toHaveCount(1);

  await page.getByTestId('task-list').locator('.del').first().click();
  await expect(page.getByTestId('task-list').locator('li')).toHaveCount(0);
  await expect(page.getByTestId('empty-state')).toBeVisible();
});

test('전체 완료 버튼을 누르면 모든 항목이 완료 처리된다', async ({ page }) => {
  await login(page);
  await page.getByTestId('task-input').fill('할 일 A');
  await page.getByTestId('add-btn').click();
  await page.getByTestId('task-input').fill('할 일 B');
  await page.getByTestId('add-btn').click();
  await expect(page.getByTestId('remaining')).toHaveText('2개 남음');

  await page.getByTestId('complete-all-btn').click();
  await expect(page.getByTestId('remaining')).toHaveText('0개 남음');

  await page.getByTestId('filter-done').click();
  await expect(page.getByTestId('task-list').locator('li')).toHaveCount(2);
});
