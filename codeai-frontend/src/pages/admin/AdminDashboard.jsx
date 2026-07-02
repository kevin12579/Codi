import { useState, useEffect } from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Users, Activity, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react'
import apiClient from '../../api/client'
import AdminActionButton from '../components/AdminActionButton'
import { useAuth } from '../../auth/AuthContext'

function Counter({ end }) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        let start = 0
        const step = end / 20
        const timer = setInterval(() => {
            start += step
            if (start >= end) { setCount(end); clearInterval(timer) }
            else setCount(Math.floor(start))
        }, 50)
        return () => clearInterval(timer)
    }, [end])
    return <>{count}</>
}

export default function AdminDashboard({ maintenanceMode, onToggleMaintenance }) {
    const [stats, setStats] = useState(null)
    const [hourlyData, setHourlyData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)
                const [statsRes, hourlyRes] = await Promise.all([
                    apiClient.get('/admin/stats'),
                    apiClient.get('/admin/pipeline-hourly'),
                ])
                setStats(statsRes.data.data)
                setHourlyData(hourlyRes.data.data)
            } catch (err) {
                // 실패 시 가짜 통계를 보여주면 관리자가 오해한다 → 실제 실패 상태를 노출.
                console.error(err)
                setError('통계를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
                setStats(null)
                setHourlyData([])
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const statCards = stats
        ? [
            {
                label: '전체 유저 수',
                value: stats.totalUsers,
                sub: `이번 달 +${stats.monthlyNewUsers}명 가입`,
                icon: Users,
                color: 'text-blue-600',
                bg: 'bg-blue-50 dark:bg-blue-950',
            },
            {
                label: '실행 중인 파이프라인',
                value: stats.activePipelines,
                sub: '현재 활성 상태',
                icon: Activity,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50 dark:bg-emerald-950',
            },
            {
                label: '총 에러 발생',
                value: stats.recentErrors,
                sub: '최근 24시간 기준',
                icon: AlertTriangle,
                color: 'text-rose-600',
                bg: 'bg-rose-50 dark:bg-rose-950',
            },
        ]
        : []

    return (
        <div className="space-y-8">
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-xl">✦</span>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
                            관리자 대시보드
                        </h1>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                            시스템 전반의 현황을 확인하고 제어합니다.
                        </p>
                    </div>
                </div>

                {/* 점검 모드 토글 (AdminActionButton 적용) */}
                <AdminActionButton 
                    onClick={onToggleMaintenance}
                    requiredRole="ADMIN"
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        maintenanceMode
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-100'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:text-rose-600'
                    }`}
                >
                    {maintenanceMode
                        ? <><ShieldAlert size={16} /> 점검 모드 ON</>
                        : <><ShieldCheck size={16} /> 시스템 점검 모드</>
                    }
                </AdminActionButton>
            </div>

            {/* 점검 모드 배너 */}
            {maintenanceMode && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 px-5 py-3.5 flex items-center gap-3 text-sm text-rose-700 dark:text-rose-400 font-medium">
                    <ShieldAlert size={16} className="shrink-0" />
                    시스템이 현재 점검 모드입니다. 일반 사용자의 접근이 제한됩니다.
                </div>
            )}

            {/* 로딩 */}
            {loading && (
                <p className="text-sm text-slate-400 dark:text-slate-500">데이터를 불러오는 중...</p>
            )}

            {/* 에러 (가짜 통계 대신 실패 상태 노출) */}
            {!loading && error && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 px-5 py-3.5 flex items-center gap-3 text-sm text-rose-700 dark:text-rose-400 font-medium">
                    <AlertTriangle size={16} className="shrink-0" />
                    {error}
                </div>
            )}

            {/* 스탯 카드 */}
            {!loading && (
                <div className="grid grid-cols-3 gap-5">
                    {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
                        <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 flex items-start gap-4 shadow-sm">
                            <div className={`${bg} ${color} p-3 rounded-xl`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1">{label}</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                    <Counter end={value} />
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 차트 */}
            {!loading && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">파이프라인 실행 추이</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">최근 24시간 기준</p>
                        </div>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full">오늘</span>
                    </div>

                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={hourlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0066ff" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#0066ff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} interval={3} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: '1px solid #334155',
                                    background: '#1e293b',
                                    fontSize: '12px',
                                    color: '#f1f5f9',
                                }}
                                labelStyle={{ fontWeight: 600, color: '#f1f5f9' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#0066ff" strokeWidth={2} fill="url(#blueGrad)" dot={false} activeDot={{ r: 4 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}