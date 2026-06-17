import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const EVENT_LOG_STORAGE_KEY = 'eventLogItemsV1'
const EVENT_LOG_AUTO_REFRESH_STORAGE_KEY = 'eventLogAutoRefreshV1'
const EVENT_LOG_DAY_KEY_STORAGE_KEY = 'eventLogDayKeyV1'

const seedLogs = [
    {
        id: 'evt-1201',
        level: 'info',
        source: 'workflow',
        action: '워크플로우 실행 시작',
        detail: 'wf-9012 실행이 큐에 등록되었습니다.',
        ts: '10:21:12',
    },
    {
        id: 'evt-1200',
        level: 'warn',
        source: 'mcp',
        action: 'MCP 재연결 시도',
        detail: 'Notion MCP 연결이 끊겨 자동 재연결을 시도합니다.',
        ts: '10:20:08',
    },
    {
        id: 'evt-1199',
        level: 'error',
        source: 'workflow',
        action: '배포 단계 실패',
        detail: 'DEPLOY_TIMEOUT: 배포 시간 제한을 초과했습니다.',
        ts: '10:18:54',
    },
    {
        id: 'evt-1198',
        level: 'info',
        source: 'auth',
        action: '사용자 로그인',
        detail: 'hong@example.com 계정이 로그인했습니다.',
        ts: '10:17:10',
    },
    ]

    const levelStyle = {
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    }

    const levelLabel = {
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
    }

    const randomPick = (items) => items[Math.floor(Math.random() * items.length)]

    const formatDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
    }

    const getTodayKey = () => formatDateKey(new Date())

    const getStoredDayKey = () => {
    try {
        return localStorage.getItem(EVENT_LOG_DAY_KEY_STORAGE_KEY)
    } catch {
        return null
    }
    }

    const isStoredDayCurrent = () => getStoredDayKey() === getTodayKey()

    const getMsUntilNextMidnight = () => {
    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setHours(24, 0, 0, 0)
    return nextMidnight.getTime() - now.getTime()
    }

    const makeRandomEvent = (nextIdNum) => {
    const level = randomPick(['info', 'warn', 'error'])
    const source = randomPick(['workflow', 'mcp', 'auth', 'system'])

    const templates = {
        info: [
        ['워크플로우 완료', 'wf-9013 실행이 정상 완료되었습니다.'],
        ['MCP 상태 확인', 'GitHub MCP 상태 점검이 완료되었습니다.'],
        ['세션 갱신', '사용자 세션 타이머가 갱신되었습니다.'],
        ],
        warn: [
        ['응답 지연 감지', '외부 서비스 응답 시간이 기준치를 초과했습니다.'],
        ['재시도 수행', 'API 요청이 1회 실패하여 자동 재시도했습니다.'],
        ['리소스 사용량 증가', '메모리 사용량이 80%를 초과했습니다.'],
        ],
        error: [
        ['파이프라인 실패', 'TEST_FAILURE: 단위 테스트 단계에서 실패가 발생했습니다.'],
        ['권한 오류', 'PERMISSION_DENIED: 배포 권한이 부족합니다.'],
        ['아티팩트 누락', 'BUILD_ARTIFACT_MISSING: 빌드 산출물을 찾을 수 없습니다.'],
        ],
    }

    const [action, detail] = randomPick(templates[level])

    return {
        id: `evt-${nextIdNum}`,
        level,
        source,
        action,
        detail,
        ts: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
    }
    }

    const loadInitialLogs = () => {
    if (!isStoredDayCurrent()) return []

    try {
        const raw = localStorage.getItem(EVENT_LOG_STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
    }

    const loadInitialAutoRefresh = () => {
    try {
        return localStorage.getItem(EVENT_LOG_AUTO_REFRESH_STORAGE_KEY) === 'true'
    } catch {
        return false
    }
    }

    export default function EventLog({ isActive = true }) {
    const [logs, setLogs] = useState(loadInitialLogs)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isAutoRefresh, setIsAutoRefresh] = useState(loadInitialAutoRefresh)
    const [levelFilter, setLevelFilter] = useState('all')
    const [sourceFilter, setSourceFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [selectedId, setSelectedId] = useState('')
    const [lastUpdatedAt, setLastUpdatedAt] = useState(new Date())
    const [dayKey, setDayKey] = useState(getTodayKey)
    const refreshInFlightRef = useRef(false)
    const refreshTimerRef = useRef(null)

    useEffect(() => {
        localStorage.setItem(EVENT_LOG_STORAGE_KEY, JSON.stringify(logs))
    }, [logs])

    useEffect(() => {
        localStorage.setItem(EVENT_LOG_AUTO_REFRESH_STORAGE_KEY, String(isAutoRefresh))
    }, [isAutoRefresh])

    const resetDailyData = useCallback((nextDayKey) => {
    setLogs([])
    setSelectedId('')
    setLastUpdatedAt(new Date())
    setDayKey(nextDayKey)

    localStorage.setItem(EVENT_LOG_DAY_KEY_STORAGE_KEY, nextDayKey)
    localStorage.setItem(EVENT_LOG_STORAGE_KEY, JSON.stringify([]))
    }, [])

    useEffect(() => {
    if (!isStoredDayCurrent()) {
        resetDailyData(getTodayKey())
        return
    }

    localStorage.setItem(EVENT_LOG_DAY_KEY_STORAGE_KEY, getTodayKey())
    }, [resetDailyData])

    useEffect(() => {
    const timer = setTimeout(() => {
        resetDailyData(getTodayKey())
    }, getMsUntilNextMidnight())

    return () => clearTimeout(timer)
    }, [dayKey, resetDailyData])

    const toggleAutoRefresh = () => {
    setIsAutoRefresh((prev) => {
        const next = !prev
        localStorage.setItem(EVENT_LOG_AUTO_REFRESH_STORAGE_KEY, String(next))
        return next
    })
    }

    const runRefresh = useCallback(() => {
        if (refreshInFlightRef.current) return
        refreshInFlightRef.current = true
        setIsRefreshing(true)
        refreshTimerRef.current = setTimeout(() => {
        setLogs((prev) => {
            const lastNum = prev.length > 0
            ? Math.max(...prev.map((log) => Number(log.id.replace('evt-', ''))))
            : 1200
            const nextLog = makeRandomEvent(lastNum + 1)
            return [nextLog, ...prev].slice(0, 120)
        })
        setLastUpdatedAt(new Date())
        setIsRefreshing(false)
        refreshInFlightRef.current = false
        refreshTimerRef.current = null
        }, 260)
    }, [])

    useEffect(() => {
        if (!isAutoRefresh || !isActive) return undefined
        runRefresh()
        const timer = setInterval(() => runRefresh(), 9000)
        return () => clearInterval(timer)
    }, [isAutoRefresh, isActive, runRefresh])

    useEffect(() => {
        if (isActive) return undefined

        if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
        }

        refreshInFlightRef.current = false
        setIsRefreshing(false)
        return undefined
    }, [isActive])

    useEffect(() => {
        return () => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current)
            refreshTimerRef.current = null
        }
        refreshInFlightRef.current = false
        }
    }, [])

    const filteredLogs = useMemo(() => {
        const keyword = search.trim().toLowerCase()
        return logs.filter((log) => {
        if (levelFilter !== 'all' && log.level !== levelFilter) return false
        if (sourceFilter !== 'all' && log.source !== sourceFilter) return false
        if (!keyword) return true

        const joined = `${log.id} ${log.source} ${log.action} ${log.detail}`.toLowerCase()
        return joined.includes(keyword)
        })
    }, [logs, levelFilter, sourceFilter, search])

    useEffect(() => {
        if (filteredLogs.length === 0) {
        setSelectedId('')
        return
        }
        if (!filteredLogs.some((log) => log.id === selectedId)) {
        setSelectedId(filteredLogs[0].id)
        }
    }, [filteredLogs, selectedId])

    const selectedLog = useMemo(() => {
        return filteredLogs.find((log) => log.id === selectedId) || filteredLogs[0] || null
    }, [filteredLogs, selectedId])

    const summary = useMemo(() => {
        return {
        total: logs.length,
        error: logs.filter((log) => log.level === 'error').length,
        warn: logs.filter((log) => log.level === 'warn').length,
        info: logs.filter((log) => log.level === 'info').length,
        }
    }, [logs])

    return (
        <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">이벤트 로그</h1>
            <p className="mt-1 text-sm text-slate-500">시스템 이벤트 흐름과 오류를 실시간으로 추적합니다.</p>
            <p className="mt-1 text-xs text-slate-400">마지막 갱신: {lastUpdatedAt.toLocaleTimeString('ko-KR')}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
            <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ID/메시지 검색"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#0066ff] focus:outline-none"
            />

            <select
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
                <option value="all">모든 레벨</option>
                <option value="error">ERROR</option>
                <option value="warn">WARN</option>
                <option value="info">INFO</option>
            </select>

            <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
                <option value="all">모든 소스</option>
                <option value="workflow">workflow</option>
                <option value="mcp">mcp</option>
                <option value="auth">auth</option>
                <option value="system">system</option>
            </select>

            <button
                type="button"
                onClick={runRefresh}
                disabled={isRefreshing}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isRefreshing ? '갱신 중...' : '새로고침'}
            </button>

            <button
                type="button"
                onClick={toggleAutoRefresh}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                isAutoRefresh
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
            >
                자동 갱신 {isAutoRefresh ? 'ON' : 'OFF'}
            </button>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <StatCard label="전체 로그" value={`${summary.total}건`} />
            <StatCard label="ERROR" value={`${summary.error}건`} tone="error" />
            <StatCard label="WARN" value={`${summary.warn}건`} tone="warn" />
            <StatCard label="INFO" value={`${summary.info}건`} tone="info" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-bold text-slate-800">실시간 로그 스트림</p>
            </div>

            {filteredLogs.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">조건에 맞는 로그가 없습니다.</div>
            ) : (
                <div className="max-h-[520px] overflow-y-auto">
                {filteredLogs.map((log) => (
                    <button
                    key={log.id}
                    type="button"
                    onClick={() => setSelectedId(log.id)}
                    className={`w-full border-t border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                        selectedLog?.id === log.id ? 'bg-blue-50/40' : ''
                    }`}
                    >
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-bold ${levelStyle[log.level]}`}>
                            {levelLabel[log.level]}
                        </span>
                        <span className="text-xs font-semibold uppercase text-slate-500">{log.source}</span>
                        </div>
                        <span className="text-xs text-slate-400">{log.ts}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{log.action}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{log.id}</p>
                    </button>
                ))}
                </div>
            )}
            </div>

            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-800">로그 상세</p>

            {!selectedLog ? (
                <p className="mt-4 text-sm text-slate-500">선택된 로그가 없습니다.</p>
            ) : (
                <div className="mt-4 space-y-3 text-sm">
                <DetailRow label="로그 ID" value={selectedLog.id} />
                <DetailRow label="레벨" value={levelLabel[selectedLog.level]} />
                <DetailRow label="소스" value={selectedLog.source} />
                <DetailRow label="시간" value={selectedLog.ts} />
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">{selectedLog.action}</p>
                    <p className="mt-1">{selectedLog.detail}</p>
                </div>
                </div>
            )}
            </div>
        </div>
        </section>
    )
    }

    function StatCard({ label, value, tone = 'default' }) {
    const toneClass = {
        default: 'text-slate-900',
        info: 'text-sky-700',
        warn: 'text-amber-700',
        error: 'text-rose-700',
    }

    return (
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`mt-2 text-2xl font-black tracking-tight ${toneClass[tone]}`}>{value}</p>
        </div>
    )
    }

    function DetailRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="text-right font-medium text-slate-700">{value}</span>
        </div>
    )
    }
