// Codi 전용 Playwright 실행 서버 (Express). 종합설계 §7-3.
// 백엔드 PlaywrightRunnerClient 가 POST /run 으로 호출하고 결과 JSON 을 수신한다.
const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');

const app = express();
app.use(express.json());

// 헬스체크 — 백엔드 PlaywrightHealthIndicator 가 사용.
app.get('/health', (_req, res) => res.json({ status: 'UP' }));

app.post('/run', (req, res) => {
  const { targetUrl = process.env.BASE_URL || 'http://frontend:80' } = req.body || {};
  try {
    execSync('npx playwright test --reporter=json', {
      // PLAYWRIGHT_JSON_OUTPUT_NAME 로 json 리포트를 파일로 강제(미지정 시 stdout 으로만 나감).
      env: { ...process.env, BASE_URL: targetUrl, PLAYWRIGHT_JSON_OUTPUT_NAME: '/app/test-results.json' },
      cwd: '/app',
      timeout: 300000, // 5분
      stdio: 'pipe',
    });
    const raw = JSON.parse(fs.readFileSync('/app/test-results.json', 'utf8'));
    res.json(parseResults(raw));
  } catch (e) {
    // 테스트 실패 시에도 reporter 가 JSON 을 남기므로 한 번 더 파싱 시도.
    try {
      const raw = JSON.parse(fs.readFileSync('/app/test-results.json', 'utf8'));
      res.json(parseResults(raw));
    } catch {
      res.status(500).json({ status: 'FAILED', totalTests: 0, passed: 0, failed: 1, cases: [] });
    }
  }
});

function parseResults(raw) {
  const suites = raw.suites || [];
  const cases = [];
  let passed = 0;
  let failed = 0;
  const collect = (s) => {
    (s.specs || []).forEach((spec) => {
      const ok = (spec.tests || []).every((t) => (t.results || []).every((r) => r.status === 'passed'));
      const durationMs = spec.tests?.[0]?.results?.[0]?.duration || 0;
      cases.push({ name: spec.title, status: ok ? 'PASSED' : 'FAILED', durationMs });
      ok ? passed++ : failed++;
    });
    (s.suites || []).forEach(collect);
  };
  suites.forEach(collect);
  return { status: failed === 0 ? 'PASSED' : 'FAILED', totalTests: passed + failed, passed, failed, cases };
}

app.listen(3001, () => console.log('playwright-server listening on :3001'));
