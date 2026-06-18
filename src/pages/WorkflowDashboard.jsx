import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    } from 'recharts'

    const WORKFLOW_STORAGE_KEY = 'workflowDashboardRunsV1'
    const FAILURE_STATS_STORAGE_KEY = 'workflowDashboardFailureStatsV1'
    const WORKFLOW_EXECUTION_STATS_KEY = 'workflowDashboardExecutionStatsV1'
    const WORKFLOW_AUTO_REFRESH_STORAGE_KEY = 'workflowDashboardAutoRefreshV1'
    const WORKFLOW_DAY_KEY_STORAGE_KEY = 'workflowDashboardDayKeyV1'

    const initialRuns = [
    { id: 'wf-9012', branch: 'main', status: 'success', durationSec: 482, startedAt: '10:18', reason: '-' },
    { id: 'wf-9011', branch: 'release/2.0', status: 'failed', durationSec: 233, startedAt: '09:54', reason: 'TEST_FAILURE' },
    { id: 'wf-9010', branch: 'main', status: 'running', durationSec: 191, startedAt: '09:45', reason: '-' },
    { id: 'wf-9009', branch: 'feature/mcp-hub', status: 'success', durationSec: 521, startedAt: '09:31', reason: '-' },
    { id: 'wf-9008', branch: 'main', status: 'failed', durationSec: 178, startedAt: '09:02', reason: 'BUILD_ARTIFACT_MISSING' },
    { id: 'wf-9007', branch: 'feature/event-log', status: 'success', durationSec: 410, startedAt: '08:48', reason: '-' },
    ]

    const failurePool = ['TEST_FAILURE', 'BUILD_ARTIFACT_MISSING', 'PERMISSION_DENIED', 'DEPLOY_TIMEOUT']

    const statusClass = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
    running: 'bg-blue-50 text-blue-700 border-blue-200',
    }

    const statusLabel = {
    success: '성공',
    failed: '실패',
    running: '진행중',
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
        return localStorage.getItem(WORKFLOW_DAY_KEY_STORAGE_KEY)
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

    const loadInitialRuns = () => {
    if (!isStoredDayCurrent()) return []

    try {
        const raw = localStorage.getItem(WORKFLOW_STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
    }

    const buildFailureStatsFromRuns = (runs) => {
    return runs
        .filter((run) => run.status === 'failed' && run.reason !== '-')
        .reduce((acc, run) => {
        acc[run.reason] = (acc[run.reason] || 0) + 1
        return acc
        }, {})
    }

    const loadInitialFailureStats = () => {
    if (!isStoredDayCurrent()) return {}

    try {
        const raw = localStorage.getItem(FAILURE_STATS_STORAGE_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
        return {}
    }
    }

    const loadInitialExecutionStats = (runs) => {
    const fallback = {
        date: getTodayKey(),
        total: 0,
        failed: 0,
    }

    if (!isStoredDayCurrent()) return fallback

    try {
        const raw = localStorage.getItem(WORKFLOW_EXECUTION_STATS_KEY)
        if (!raw) return fallback
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') return fallback
        if (parsed.date !== getTodayKey()) return fallback

        return {
        date: parsed.date,
        total: Number(parsed.total) || fallback.total,
        failed: Number(parsed.failed) || fallback.failed,
        }
    } catch (error) {
        console.error('Error parsing workflow execution stats:', error);
        return fallback
    }
    }

    const loadInitialAutoRefresh = () => {
    try {
        return localStorage.getItem(WORKFLOW_AUTO_REFRESH_STORAGE_KEY) === 'true'
    } catch {
        return false
    }
    }

    const nextStatus = () => {
    const dice = Math.random()
    if (dice < 0.58) return 'success'
    if (dice < 0.86) return 'failed'
    return 'running'
    }

    const makeNextRun = (latestIdNum) => {
    const status = nextStatus()
    return {
        id: `wf-${latestIdNum + 1}`,
        branch: randomPick(['main', 'release/2.0', 'feature/mcp-hub', 'feature/workflow-dashboard', 'hotfix/login']),
        status,
        durationSec: status === 'running' ? Math.floor(Math.random() * 220) + 80 : Math.floor(Math.random() * 480) + 120,
        startedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        reason: status === 'failed' ? randomPick(failurePool) : '-',
    }
    }

    const refreshRuns = (current) => {
    const base = current.slice(0, 11).map((run) => {
        if (run.status !== 'running') return run

        const promote = Math.random() < 0.55
        if (!promote) {
        return { ...run, durationSec: run.durationSec + Math.floor(Math.random() * 20) + 8 }
        }

        const success = Math.random() < 0.72
        return {
        ...run,
        status: success ? 'success' : 'failed',
        reason: success ? '-' : randomPick(failurePool),
        durationSec: run.durationSec + Math.floor(Math.random() * 40) + 20,
        }
    })

    const latestIdNum = base.length > 0
        ? Math.max(...base.map((run) => Number(run.id.replace('wf-', ''))))
        : 9000
    return [makeNextRun(latestIdNum), ...base]
    }

    export default function WorkflowDashboard({ isActive = true }) {
    const [runs, setRuns] = useState(loadInitialRuns)
    const [failureStats, setFailureStats] = useState(loadInitialFailureStats)
    const [executionStats, setExecutionStats] = useState(() => loadInitialExecutionStats(loadInitialRuns()))
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isAutoRefresh, setIsAutoRefresh] = useState(loadInitialAutoRefresh)
    const [statusFilter, setStatusFilter] = useState('all')
    const [lastUpdatedAt, setLastUpdatedAt] = useState(new Date())
    const refreshInFlightRef = useRef(false)
    const refreshTimerRef = useRef(null)

    useEffect(() => {
        localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(runs))
    }, [runs])

    useEffect(() => {
        localStorage.setItem(FAILURE_STATS_STORAGE_KEY, JSON.stringify(failureStats))
    }, [failureStats])

    useEffect(() => {
        localStorage.setItem(WORKFLOW_EXECUTION_STATS_KEY, JSON.stringify(executionStats))
    }, [executionStats])

    useEffect(() => {
        localStorage.setItem(WORKFLOW_AUTO_REFRESH_STORAGE_KEY, String(isAutoRefresh))
    }, [isAutoRefresh])

    useEffect(() => {
        localStorage.setItem(WORKFLOW_DAY_KEY_STORAGE_KEY, getTodayKey())
    }, [])

    const resetDailyData = (dateKey) => {
        setRuns([])
        setFailureStats({})
        setExecutionStats({ date: dateKey, total: 0, failed: 0 })
        localStorage.setItem(WORKFLOW_DAY_KEY_STORAGE_KEY, dateKey)
        localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify([]))
        localStorage.setItem(FAILURE_STATS_STORAGE_KEY, JSON.stringify({}))
        localStorage.setItem(WORKFLOW_EXECUTION_STATS_KEY, JSON.stringify({ date: dateKey, total: 0, failed: 0 }))
        setLastUpdatedAt(new Date())
    }

    useEffect(() => {
        const today = getTodayKey()
        if (executionStats.date !== today) {
        resetDailyData(today)
        }
    }, [executionStats.date])

    useEffect(() => {
        const timer = setTimeout(() => {
        resetDailyData(getTodayKey())
        }, getMsUntilNextMidnight())

        return () => clearTimeout(timer)
    }, [executionStats.date])

    const toggleAutoRefresh = () => {
        setIsAutoRefresh((prev) => {
        const next = !prev
        localStorage.setItem(WORKFLOW_AUTO_REFRESH_STORAGE_KEY, String(next))
        return next
        })
    }

    const runRefresh = useCallback(() => {
        if (refreshInFlightRef.current) return
        refreshInFlightRef.current = true
        setIsRefreshing(true)
        refreshTimerRef.current = setTimeout(() => {
        setRuns((prev) => {
            const next = refreshRuns(prev)
            const prevById = new Map(prev.map((run) => [run.id, run]))
            const prevIds = new Set(prev.map((run) => run.id))
            const createdCount = next.filter((run) => !prevIds.has(run.id)).length

            const increments = next.reduce((acc, run) => {
            if (run.status !== 'failed' || run.reason === '-') return acc

            const before = prevById.get(run.id)
            const becameFailed = !before || before.status !== 'failed' || before.reason !== run.reason

            if (becameFailed) {
                acc[run.reason] = (acc[run.reason] || 0) + 1
            }
            return acc
            }, {})

            if (Object.keys(increments).length > 0) {
            setFailureStats((prevStats) => {
                const merged = { ...prevStats }
                Object.entries(increments).forEach(([reason, count]) => {
                merged[reason] = (merged[reason] || 0) + count
                })
                return merged
            })
            }

            const newlyFailedCount = Object.values(increments).reduce((sum, count) => sum + count, 0)
            setExecutionStats((prevStats) => {
            const today = getTodayKey()
            const base = prevStats?.date === today ? prevStats : { date: today, total: 0, failed: 0 }

            return {
                date: today,
                total: base.total + createdCount,
                failed: base.failed + newlyFailedCount,
            }
            })

            return next
        })

        setLastUpdatedAt(new Date())
        setIsRefreshing(false)
        refreshInFlightRef.current = false
        refreshTimerRef.current = null
        }, 280)
    }, [])

    useEffect(() => {
        if (!isAutoRefresh) return undefined
        runRefresh()
        const timer = setInterval(() => runRefresh(), 12000)
        return () => clearInterval(timer)
    }, [isAutoRefresh, runRefresh])

    useEffect(() => {
        if (!isActive) return
        runRefresh()
    }, [isActive, runRefresh])

    useEffect(() => {
        return () => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current)
            refreshTimerRef.current = null
        }
        refreshInFlightRef.current = false
        }
    }, [])

    const filteredRuns = useMemo(() => {
        if (statusFilter === 'all') return runs
        return runs.filter((run) => run.status === statusFilter)
    }, [runs, statusFilter])

    const kpis = useMemo(() => {
        const total = executionStats.total
        const recentTotal = runs.length
        const successCount = runs.filter((run) => run.status === 'success').length
        const failedCount = executionStats.failed
        const avgDuration = Math.round(runs.reduce((sum, run) => sum + run.durationSec, 0) / Math.max(1, recentTotal))
        const successRate = Math.round((successCount / Math.max(1, recentTotal)) * 100)

        return {
        total,
        successRate,
        avgDuration,
        failedCount,
        }
    }, [runs, executionStats])

    const trendData = useMemo(() => {
        const labels = ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'Today']
        return labels.map((label) => {
        const executions = Math.floor(Math.random() * 12) + 8
        const success = Math.floor(executions * (0.65 + Math.random() * 0.2))
        return {
            day: label,
            success,
            failed: executions - success,
        }
        })
    }, [lastUpdatedAt])

    const failureList = useMemo(() => {
        return Object.entries(failureStats)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
    }, [failureStats])

    return (
        <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">워크플로우 모니터링</h1>
            <p className="mt-1 text-sm text-slate-500">실행량, 성공률, 실패 패턴을 빠르게 확인합니다.</p>
            <p className="mt-1 text-xs text-slate-400">마지막 갱신: {lastUpdatedAt.toLocaleTimeString('ko-KR')}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
            <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#0066ff] focus:outline-none"
            >
                <option value="all">전체 상태</option>
                <option value="success">성공</option>
                <option value="failed">실패</option>
                <option value="running">진행중</option>
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
            <KpiCard label="오늘 실행 수" value={`${kpis.total}건`} />
            <KpiCard label="성공률" value={`${kpis.successRate}%`} />
            <KpiCard label="평균 실행 시간" value={`${kpis.avgDuration}s`} />
            <KpiCard label="실패 건수" value={`${kpis.failedCount}건`} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-bold text-slate-800">최근 7일 실행 추이</p>
            <div className="h-64 w-full">
                {isActive ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success" fill="#10b981" name="성공" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="failed" fill="#f43f5e" name="실패" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500">
                    탭 비활성 상태에서는 차트 렌더를 일시 중지합니다.
                </div>
                )}
            </div>
            </div>

            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-800">실패 원인 누적</p>
            <div className="mt-3 space-y-2">
                {failureList.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">최근 실패 이력이 없습니다.</p>
                ) : (
                failureList.map((item, idx) => (
                    <div key={item.reason} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <div>
                        <p className="text-xs font-bold text-slate-700">#{idx + 1} {item.reason}</p>
                    </div>
                    <span className="text-xs font-semibold text-rose-600">{item.count}건</span>
                    </div>
                ))
                )}
            </div>
            </div>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-800">최근 실행 목록</p>
            </div>

            <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                    <th className="px-4 py-3">실행 ID</th>
                    <th className="px-4 py-3">브랜치</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">시작</th>
                    <th className="px-4 py-3">소요 시간</th>
                    <th className="px-4 py-3">실패 사유</th>
                </tr>
                </thead>
                <tbody>
                {filteredRuns.map((run) => (
                    <tr key={run.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-800">{run.id}</td>
                    <td className="px-4 py-3 text-slate-600">{run.branch}</td>
                    <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusClass[run.status]}`}>
                        {statusLabel[run.status]}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{run.startedAt}</td>
                    <td className="px-4 py-3 text-slate-600">{run.durationSec}s</td>
                    <td className="px-4 py-3 text-slate-600">{run.reason}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
        </section>
    )
    }

    function KpiCard({ label, value }) {
    return (
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
    )
}
