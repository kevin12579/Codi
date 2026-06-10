export const INITIAL_PIPELINES = [
  {
    id: "PIPE-001-001",
    repo: "프론트엔드 빌드 & 배포",
    branch: "main",
    triggered: "2분 전",
    status: "Success",
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
    testResults: {
      passed: 187, failed: 0, total: 190, coverage: 98.4,
      suites: [
        { name: "단위 테스트", status: "Passed", passed: 187, total: 190 },
        { name: "통합 테스트", status: "Passed", passed: 42, total: 42 }
      ]
    },
    timeline: [
      { name: "초기화", status: "Success", duration: "12초", logs: "환경 설정 및 의존성 설치 완료\n10:23:45" },
      { name: "빌드", status: "Success", duration: "2분 15초", logs: "webpack으로 애플리케이션 빌드 성공\n10:23:57" },
      { name: "테스트", status: "Success", duration: "1분 42초", logs: "247개 테스트 모두 통과\n10:26:12" },
      { name: "코드 리뷰", status: "Success", duration: "23초", logs: "Codi AI 정밀 오딧 검수 완료\n10:27:54" }
    ],
    notifications: [
      { event: "파이프라인 시작됨", time: "10:23:30", details: "홍길동이 파이프라인 실행을 시작함" },
      { event: "빌드 완료", time: "10:26:12", details: "빌드 프로세스가 성공적으로 완료됨" },
      { event: "테스트 통과", time: "10:27:54", details: "247개 테스트 모두 성공적으로 통과" },
      { event: "배포 완료", time: "10:28:17", details: "프로덕션 환경에 성공적으로 배포됨" }
    ]
  },
  {
    id: "PIPE-001-002",
    repo: "백엔드 API 테스트",
    branch: "develop",
    triggered: "5분 전",
    status: "In-Progress",
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
    testResults: {
      passed: 120, failed: 0, total: 120, coverage: 85.0,
      suites: [{ name: "기능 검증 테스트", status: "Passed", passed: 120, total: 120 }]
    },
    timeline: [
      { name: "초기화", status: "Success", duration: "8초", logs: "종속성 패키지 복원 성공\n10:28:02" },
      { name: "빌드", status: "Success", duration: "1분 10초", logs: "ts-node 컴파일 성공\n10:28:10" },
      { name: "테스트", status: "In-Progress", duration: "1분 00초", logs: "API 통합 기능 테스트 실행 중...\n10:29:20" }
    ],
    notifications: [
      { event: "파이프라인 시작됨", time: "10:28:00", details: "홍길동이 개발 브랜치 API 통합 검수를 기동함" }
    ]
  },
  {
    id: "PIPE-001-003",
    repo: "통합 테스트",
    branch: "feature/auth",
    triggered: "12분 전",
    status: "Failed",
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
    testResults: {
      passed: 18, failed: 3, total: 21, coverage: 45.2,
      suites: [{ name: "인증 플로우 테스트", status: "Failed", passed: 18, total: 21 }]
    },
    timeline: [
      { name: "초기화", status: "Success", duration: "15초", logs: "패키지 적재 성공" },
      { name: "빌드", status: "Success", duration: "2분 00초", logs: "성공" },
      { name: "테스트", status: "Failed", duration: "6분 30초", logs: "오류: verifySession 에서 3개의 단언(Assert) 실패 검출\n10:19:12" }
    ],
    notifications: [
      { event: "파이프라인 기동", time: "10:11:00", details: "피처 브랜치 원격 병합 요청 시 트리거됨" },
      { event: "테스트 실패 통지", time: "10:17:30", details: "verifySession 검증 스위트 실패 경보 발송" }
    ]
  },
  {
    id: "PIPE-001-004",
    repo: "보안 스캔",
    branch: "main",
    triggered: "28분 전",
    status: "Success",
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
    testResults: {
      passed: 50, failed: 0, total: 50, coverage: 100.0,
      suites: [{ name: "정적 보안 스캔(SAST)", status: "Passed", passed: 50, total: 50 }]
    },
    timeline: [
      { name: "초기화", status: "Success", duration: "10초", logs: "스캐너 구성 성공" },
      { name: "빌드", status: "Success", duration: "1분 02초", logs: "컴파일 성공" },
      { name: "테스트", status: "Success", duration: "2분 00초", logs: "취약점 0건 검출" }
    ],
    notifications: [
      { event: "시스템 스캔 시작", time: "09:50:00", details: "주간 자동 정적 스캐너 기동" }
    ]
  }
]
