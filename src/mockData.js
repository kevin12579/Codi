export const INITIAL_PIPELINES = [
  {
    id: "PIPE-001-001",
    repositoryFullName: "org/codeai-frontend",
    prNumber: 142,
    prTitle: "feat: dashboard quality cards",
    prAuthor: "hong-dev",
    vcsId: "github",
    repo: "프론트엔드 빌드 & 배포",
    branch: "main",
    triggered: "2분 전",
    status: "SUCCESS",
    timing: "4분 32초",
    commit: "3",
    commentCount: 3,
    codeSnippet: `const UserProfile = ({ user, onUpdate }) => {
  return (
    <div className="profile">
      <UserAvatar user={user} />
      <UserDetails user={user} />
    </div>
  );
};`,
    aiComments: [
      {
        id: "comment-1",
        severity: "warning",
        line: 42,
        title: "불필요한 리렌더링 방지를 위해 컴포넌트 메모이제이션을 고려하세요",
        description: "React.memo()로 감싸거나 비용이 큰 계산에 useMemo를 사용해 객체 전달 최적화를 고려하십시오.",
        suggestion: `const UserProfile = React.memo(({ user, onUpdate }) => {
  return (
    <div className="profile">
      <UserAvatar user={user} />
      <UserDetails user={user} />
    </div>
  );
});`
      }
    ],
    review: {
      engineId: "openai",
      promptVersion: "v3",
      comments: [
        {
          severity: "MEDIUM",
          filePath: "src/components/UserProfile.jsx",
          lineNumber: 42,
          content: "불필요한 리렌더링 방지를 위해 메모이제이션을 고려하세요.",
          suggestion: "const UserProfile = React.memo(({ user, onUpdate }) => { ... })"
        }
      ]
    },
    testResults: {
      passed: 187, failed: 0, total: 190, coverage: 98.4,
      suites: [
        { name: "단위 테스트", status: "Passed", passed: 187, total: 190 },
        { name: "통합 테스트", status: "Passed", passed: 42, total: 42 }
      ]
    },
    testRun: {
      runnerId: "playwright",
      status: "PASSED",
      totalTests: 229,
      passed: 229,
      failed: 0,
      coveragePct: 98.4
    },
    timeline: [
      { name: "초기화", status: "Success", duration: "12초", logs: "환경 설정 및 의존성 설치 완료\n10:23:45" },
      { name: "빌드", status: "Success", duration: "2분 15초", logs: "webpack으로 애플리케이션 빌드 성공\n10:23:57" },
      { name: "테스트", status: "Success", duration: "1분 42초", logs: "247개 테스트 모두 통과\n10:26:12" },
      { name: "코드 리뷰", status: "Success", duration: "23초", logs: "Codi AI 정밀 오딧 검수 완료\n10:27:54" }
    ],
    notifications: [
      { channelId: "slack", status: "SENT", sentAt: "2026-06-17T10:28:17Z" }
    ]
  },
  {
    id: "PIPE-001-002",
    repositoryFullName: "org/codeai-backend",
    prNumber: 87,
    prTitle: "feat: api test runner",
    prAuthor: "kim-dev",
    vcsId: "github",
    repo: "백엔드 API 테스트",
    branch: "develop",
    triggered: "5분 전",
    status: "RUNNING",
    timing: "2분 18초",
    commit: "2",
    commentCount: 2,
    codeSnippet: `import express from 'express';
export function setupRoutes(app) {
  app.get('/api/v1/health', (req, res) => {
    res.status(200).send('HEALTHY');
  });
}`,
    aiComments: [
      {
        id: "comment-2-1",
        severity: "suggestion",
        line: 4,
        title: "헬스 체크 문자열 상수화 관리 권장",
        description: "하드코딩된 스트링은 관리에 용이하지 않으므로 상수로 선언하여 활용하는 편이 유지보수성에 적합합니다.",
        suggestion: `const HEALTH_STATUS_OK = 'HEALTHY';
app.get('/api/v1/health', (req, res) => {
  res.status(200).send(HEALTH_STATUS_OK);
});`
      }
    ],
    review: {
      engineId: "claude",
      promptVersion: "v3",
      comments: [
        {
          severity: "LOW",
          filePath: "src/server/health.ts",
          lineNumber: 4,
          content: "헬스 체크 문자열 상수화를 권장합니다.",
          suggestion: "const HEALTH_STATUS_OK = 'HEALTHY'"
        }
      ]
    },
    testResults: {
      passed: 120, failed: 0, total: 120, coverage: 85.0,
      suites: [{ name: "기능 검증 테스트", status: "Passed", passed: 120, total: 120 }]
    },
    testRun: {
      runnerId: "playwright",
      status: "RUNNING",
      totalTests: 120,
      passed: 96,
      failed: 0,
      coveragePct: 85.0
    },
    timeline: [
      { name: "초기화", status: "Success", duration: "8초", logs: "종속성 패키지 복원 성공\n10:28:02" },
      { name: "빌드", status: "Success", duration: "1분 10초", logs: "ts-node 컴파일 성공\n10:28:10" },
      { name: "테스트", status: "In-Progress", duration: "1분 00초", logs: "API 통합 기능 테스트 실행 중...\n10:29:20" }
    ],
    notifications: [
      { channelId: "slack", status: "SENT", sentAt: "2026-06-17T10:28:00Z" }
    ]
  },
  {
    id: "PIPE-001-003",
    repositoryFullName: "org/codeai-auth",
    prNumber: 68,
    prTitle: "fix: token verify flow",
    prAuthor: "lee-dev",
    vcsId: "github",
    repo: "통합 테스트",
    branch: "feature/auth",
    triggered: "12분 전",
    status: "FAILED",
    timing: "8분 45초",
    commit: "5",
    commentCount: 5,
    codeSnippet: `export async function verifySession(token) {
  if (!token) throw new Error("No token provided");
  const decoded = jwt.decode(token);
  return decoded;
}`,
    aiComments: [
      {
        id: "comment-3-1",
        severity: "critical",
        line: 6,
        title: "세션 토큰 만료 검증 프로세스 누락",
        description: "만료 기한(Exp)과 시그니처 무결성을 대조하지 않는 jwt.decode를 사용하고 있어 위변조되거나 기한이 지난 토큰도 신뢰받는 취약점이 있습니다.",
        suggestion: `try {
  const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);
  return verified;
} catch (err) {
  throw new Error("유효하지 않거나 만료된 토큰입니다.");
}`
      }
    ],
    review: {
      engineId: "openai",
      promptVersion: "v3",
      comments: [
        {
          severity: "HIGH",
          filePath: "src/auth/verifySession.js",
          lineNumber: 6,
          content: "세션 토큰 만료 검증 프로세스가 누락되어 있습니다.",
          suggestion: "jwt.verify(token, process.env.JWT_SECRET_KEY)로 시그니처/만료를 검증하세요."
        }
      ]
    },
    testResults: {
      passed: 18, failed: 3, total: 21, coverage: 45.2,
      suites: [{ name: "인증 플로우 테스트", status: "Failed", passed: 18, total: 21 }]
    },
    testRun: {
      runnerId: "playwright",
      status: "FAILED",
      totalTests: 21,
      passed: 18,
      failed: 3,
      coveragePct: 45.2
    },
    timeline: [
      { name: "초기화", status: "Success", duration: "15초", logs: "패키지 적재 성공" },
      { name: "빌드", status: "Success", duration: "2분 00초", logs: "성공" },
      { name: "테스트", status: "Failed", duration: "6분 30초", logs: "오류: verifySession 에서 3개의 단언(Assert) 실패 검출\n10:19:12" }
    ],
    notifications: [
      { channelId: "slack", status: "FAILED", sentAt: "2026-06-17T10:17:30Z" }
    ]
  },
  {
    id: "PIPE-001-004",
    repositoryFullName: "org/codeai-security",
    prNumber: 41,
    prTitle: "chore: security scan",
    prAuthor: "park-dev",
    vcsId: "github",
    repo: "보안 스캔",
    branch: "main",
    triggered: "28분 전",
    status: "SUCCESS",
    timing: "3분 12초",
    commit: "1",
    commentCount: 1,
    codeSnippet: `const API_URL = "https://production.api.server";`,
    aiComments: [
      {
        id: "comment-4-1",
        severity: "info",
        line: 2,
        title: "엔드포인트 보안 상태 정기 스캔 완료",
        description: "전송 인터페이스 및 HTTPS 규격 검수 결과, 비암호화 통신 채널이 식별되지 않아 안전합니다.",
        suggestion: "// 현 상태 보안 유지 권장"
      }
    ],
    review: {
      engineId: "claude",
      promptVersion: "v3",
      comments: [
        {
          severity: "LOW",
          filePath: "src/security/config.js",
          lineNumber: 2,
          content: "엔드포인트 보안 상태 점검이 완료되었습니다.",
          suggestion: "현 상태를 유지하며 정기 스캔을 지속하세요."
        }
      ]
    },
    testResults: {
      passed: 50, failed: 0, total: 50, coverage: 100.0,
      suites: [{ name: "정적 보안 스캔(SAST)", status: "Passed", passed: 50, total: 50 }]
    },
    testRun: {
      runnerId: "playwright",
      status: "PASSED",
      totalTests: 50,
      passed: 50,
      failed: 0,
      coveragePct: 100.0
    },
    timeline: [
      { name: "초기화", status: "Success", duration: "10초", logs: "스캐너 구성 성공" },
      { name: "빌드", status: "Success", duration: "1분 02초", logs: "컴파일 성공" },
      { name: "테스트", status: "Success", duration: "2분 00초", logs: "취약점 0건 검출" }
    ],
    notifications: [
      { channelId: "slack", status: "SENT", sentAt: "2026-06-17T09:50:00Z" }
    ]
  }
]
