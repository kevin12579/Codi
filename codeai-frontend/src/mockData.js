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


// ─── 실시간 코드 분석 목업 데이터 ────────────────────────────────────────────
export const LANGUAGES = ['TypeScript', 'Python', 'Go', 'JavaScript', 'Java', 'Kotlin']

// ⚠️ SAMPLE_CODE를 SAMPLE_FILES보다 먼저 선언 (호이스팅 에러 방지)
export const SAMPLE_CODE = `import bcrypt from 'bcrypt';
import db from './database';

export async function loginUser(req, res) {
  const { username, password } = req.body;

  // ⚠️ SQL Injection 및 직접 합산 쿼리 구조 노출
  const query = "SELECT * FROM users WHERE username = '" + username + "'";
  const user = await db.query(query);

  if (!user) {
    return res.json({ error: "사용자를 찾을 수 없습니다." });
  }

  // ⚠️ 계정정보 평문 로깅 노출
  console.log("검색 완료: " + username + " (비밀번호해시: " + user.password + ")");

  const isValid = user.password === password;
  if (isValid) {
    res.json({ status: "success", token: "TEMP_JWT_SESSION" });
  } else {
    // ⚠️ 가입정보 분출 타이밍 유실
    res.json({ error: "패스워드가 일치하지 않습니다." });
  }
}`

export const SAMPLE_FILES = [
  {
    id: 1,
    name: 'UserService.ts',
    label: '로그인 및 인증',
    code: SAMPLE_CODE,
  },
  {
    id: 2,
    name: 'paymentProcessor.py',
    label: '결제 트랜잭션',
    code: `import requests

def process_payment(user_id, amount, card_number):
    # ⚠️ 카드 정보 평문 로깅
    print(f"결제 시도: user={user_id}, card={card_number}, amount={amount}")

    # ⚠️ 금액 검증 없이 바로 외부 API 호출
    response = requests.post(
        "https://payment-gateway.example.com/charge",
        data={"card": card_number, "amount": amount}
    )

    if response.status_code == 200:
        # ⚠️ 트랜잭션 결과 검증 없이 바로 성공 처리
        update_balance(user_id, amount)
        return {"status": "success"}
    else:
        return {"status": "failed"}

def update_balance(user_id, amount):
    # ⚠️ 동시성 문제: 락 없이 잔액 갱신
    balance = get_balance(user_id)
    set_balance(user_id, balance - amount)`,
  },
  {
    id: 3,
    name: 'dataStore.go',
    label: '동시성 맵 카운터',
    code: `package main

import "fmt"

type Counter struct {
    counts map[string]int
}

func NewCounter() *Counter {
    return &Counter{counts: make(map[string]int)}
}

// ⚠️ 동시성 환경에서 맵 접근 시 race condition 발생 가능
func (c *Counter) Increment(key string) {
    c.counts[key]++
}

func (c *Counter) Get(key string) int {
    return c.counts[key]
}

func main() {
    counter := NewCounter()
    for i := 0; i < 100; i++ {
        go counter.Increment("requests") // ⚠️ goroutine에서 동시 쓰기
    }
    fmt.Println(counter.Get("requests"))
}`,
  },
]

export const MOCK_RESULT = {
  filename: 'UserService.ts',
  score: 35,
  scoreColor: '#ef4444',
  summary:
    '제공된 loginUser 함수는 심각한 보안 취약점과 구조적 결함을 내포하고 있어 즉시 리팩토링이 필요합니다. 주요 문제점으로 (1) 문자열 직접 결합을 통한 SQL 삽입(SQL Injection) 취약점, (2) 임포트된 bcrypt를 활용하지 않고 평문으로 비밀번호를 비교하는 로직, (3) 콘솔 로그를 통한 민감 정보(비밀번호해시) 노출 등이 식별되었습니다.',
  critical: 2,
  warning: 2,
  info: 1,
  issues: [
    {
      id: 1,
      type: 'critical',
      typeLabel: '치명적 위험',
      line: 8,
      title: 'SQL 삽입 (SQL Injection) 취약점 발생',
      description:
        "사용자 입력값(username)을 SQL 쿼리 문자열에 직접 결합(Concatenation)하고 있습니다. 악의적인 사용자가 입력창에 특정 SQL 구문을 조작하여 전송할 경우 데이터베이스의 전체 정보가 유출되거나 테이블이 임의로 삭제될 위험이 있습니다.",
      fix: `// 문자열 결합 대신, 매개변수화된 쿼리(Parameterized Query)를 사용하여 데이터베이스 드라이버 레벨에서 이스케이프 처리가 되도록 수정합니다.

수정 예시:
const query = 'SELECT * FROM users WHERE username = ?';
const [rows] = await db.query(query, [username]);
const user = rows[0];`,
    },
    {
      id: 2,
      type: 'critical',
      typeLabel: '치명적 위험',
      line: 18,
      title: '평문 비밀번호 비교 (bcrypt 미사용)',
      description:
        "임포트된 bcrypt 라이브러리를 사용하지 않고 user.password === password로 평문 비교하고 있습니다. 데이터베이스가 침해될 경우 모든 사용자의 비밀번호가 그대로 노출됩니다.",
      fix: `// bcrypt.compare()를 사용하여 해시된 비밀번호와 비교합니다.

수정 예시:
const isValid = await bcrypt.compare(password, user.password);`,
    },
    {
      id: 3,
      type: 'warning',
      typeLabel: '경고 요소',
      line: 13,
      title: '민감 정보 콘솔 로그 노출',
      description:
        '비밀번호 해시를 console.log로 출력하고 있어 서버 로그에 민감 정보가 기록됩니다. 로그 수집 시스템에 따라 외부로 유출될 수 있습니다.',
      fix: `// 민감 정보는 절대 로그에 포함하지 않습니다.

수정 예시:
console.log("로그인 시도:", username); // 비밀번호 해시 제거`,
    },
    {
      id: 4,
      type: 'warning',
      typeLabel: '보완 경고',
      line: 4,
      title: '함수 매개변수의 타입 정의 부재 (Implicit any)',
      description:
        "TypeScript 환경이지만 loginUser 함수의 req, res 매개변수에 대한 구체적인 타입 정의가 누락되었습니다. 컴파일 타임의 타입 체크 이점을 잃게 만들고 코드 가독성을 저해합니다.",
      fix: `// Express 프레임워크를 사용 중인 경우, 공식 제공되는 Request 및 Response 타입을 활용하여 매개변수 타입을 지정해야 합니다.

수정 예시:
import { Request, Response } from 'express';
export async function loginUser(req: Request, res: Response) { ... }`,
    },
    {
      id: 5,
      type: 'info',
      typeLabel: '개선 의견',
      line: 11,
      title: '계정 존재 여부 파악이 가능한 상세 에러 정보 반환',
      description:
        "'사용자를 찾을 수 없습니다'와 '패스워드가 일치하지 않습니다'라는 상이한 에러 메시지를 분기하여 클라이언트에 응답하고 있습니다. 이는 공격자에게 서비스에 존재하는 가입 계정 목록을 추적(Username Enumeration)할 수 있는 빌미를 제공합니다.",
      fix: `// 보안 강화를 위해 로그인 실패 시 동일하게 '아이디 또는 비밀번호가 잘못되었습니다.'와 같이 추상화된 메시지를 제공하는 것이 안전합니다.`,
    },
  ],
}

export const MOCK_RESULT_PAYMENT = {
  filename: 'paymentProcessor.py',
  score: 42,
  scoreColor: '#ef4444',
  summary:
    'paymentProcessor.py는 결제 처리 로직에서 다수의 보안 및 안정성 문제를 내포하고 있습니다. 주요 문제점으로 (1) 카드 정보 평문 로깅, (2) 외부 API 응답 검증 미흡, (3) 동시성 환경에서의 잔액 갱신 race condition 등이 식별되었습니다.',
  critical: 2,
  warning: 1,
  info: 1,
  issues: [
    {
      id: 1,
      type: 'critical',
      typeLabel: '치명적 위험',
      line: 5,
      title: '카드 정보 평문 로깅 노출',
      description:
        "카드 번호(card_number)를 print()를 통해 그대로 로그에 기록하고 있습니다. PCI-DSS 규정 위반이며, 로그 유출 시 카드 정보가 그대로 노출됩니다.",
      fix: `// 카드 번호 등 민감 정보는 절대 로그에 남기지 않고, 마스킹 처리합니다.

수정 예시:
masked = card_number[:4] + "****" + card_number[-4:]
print(f"결제 시도: user={user_id}, card={masked}, amount={amount}")`,
    },
    {
      id: 2,
      type: 'critical',
      typeLabel: '치명적 위험',
      line: 14,
      title: '외부 API 응답 검증 부족',
      description:
        "response.status_code == 200만 확인하고 응답 바디(트랜잭션 ID, 실제 승인 여부 등)를 검증하지 않습니다. 게이트웨이가 200을 반환했더라도 실제 결제가 실패했을 수 있습니다.",
      fix: `// 응답 바디의 트랜잭션 상태 필드까지 함께 검증합니다.

수정 예시:
data = response.json()
if response.status_code == 200 and data.get("transaction_status") == "approved":
    update_balance(user_id, amount)
    return {"status": "success", "tx_id": data.get("tx_id")}`,
    },
    {
      id: 3,
      type: 'warning',
      typeLabel: '경고 요소',
      line: 21,
      title: '잔액 갱신 시 동시성(Race Condition) 위험',
      description:
        "get_balance와 set_balance 사이에 락(lock)이나 트랜잭션 처리가 없어, 동시에 여러 요청이 들어오면 잔액이 잘못 계산될 수 있습니다.",
      fix: `// DB 트랜잭션 또는 원자적(atomic) 연산을 사용합니다.

수정 예시:
with db.transaction():
    db.execute(
        "UPDATE accounts SET balance = balance - %s WHERE user_id = %s",
        [amount, user_id]
    )`,
    },
    {
      id: 4,
      type: 'info',
      typeLabel: '개선 의견',
      line: 1,
      title: '환경 변수를 통한 결제 게이트웨이 URL 관리 권장',
      description:
        "결제 게이트웨이 URL이 하드코딩되어 있습니다. 환경별(개발/스테이징/프로덕션)로 다른 엔드포인트를 사용할 수 있도록 환경 변수로 관리하는 것이 좋습니다.",
      fix: `// 환경 변수를 통해 URL을 주입받습니다.

수정 예시:
import os
PAYMENT_GATEWAY_URL = os.environ["PAYMENT_GATEWAY_URL"]`,
    },
  ],
}

export const MOCK_RESULT_GO = {
  filename: 'dataStore.go',
  score: 58,
  scoreColor: '#f59e0b',
  summary:
    'dataStore.go는 다수의 goroutine이 동시에 맵(map)에 접근하는 구조로, Go의 map은 동시 쓰기에 대해 안전하지 않습니다. race condition으로 인한 데이터 손상 및 런타임 패닉(fatal error: concurrent map writes) 위험이 있습니다.',
  critical: 1,
  warning: 1,
  info: 1,
  issues: [
    {
      id: 1,
      type: 'critical',
      typeLabel: '치명적 위험',
      line: 17,
      title: '동시성 맵 쓰기로 인한 Race Condition',
      description:
        "여러 goroutine이 동시에 c.counts[key]++ 를 실행하고 있습니다. Go의 기본 map은 동시 쓰기에 안전하지 않아 'fatal error: concurrent map writes' 런타임 패닉이 발생할 수 있습니다.",
      fix: `// sync.Mutex 또는 sync.Map을 사용해 동시 접근을 보호합니다.

수정 예시:
type Counter struct {
    mu     sync.Mutex
    counts map[string]int
}

func (c *Counter) Increment(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.counts[key]++
}`,
    },
    {
      id: 2,
      type: 'warning',
      typeLabel: '경고 요소',
      line: 26,
      title: 'goroutine 완료 대기 누락',
      description:
        "main 함수에서 100개의 goroutine을 실행하지만, 이들이 완료되기를 기다리는 동기화 로직(WaitGroup 등)이 없습니다. 메인 함수가 먼저 끝나면 일부 goroutine이 실행되지 못한 채 종료될 수 있습니다.",
      fix: `// sync.WaitGroup으로 모든 goroutine의 완료를 보장합니다.

수정 예시:
var wg sync.WaitGroup
for i := 0; i < 100; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        counter.Increment("requests")
    }()
}
wg.Wait()`,
    },
    {
      id: 3,
      type: 'info',
      typeLabel: '개선 의견',
      line: 7,
      title: 'sync.Map 도입 검토 권장',
      description:
        "단순 카운터 용도라면 atomic 패키지의 Int64나 sync/atomic 연산을 활용하는 것이 mutex보다 더 가벼운 대안이 될 수 있습니다.",
      fix: `// 단일 카운터라면 atomic 패키지를 고려합니다.

수정 예시:
import "sync/atomic"

var counter int64
atomic.AddInt64(&counter, 1)`,
    },
  ],
}