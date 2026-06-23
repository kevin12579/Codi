    import { useState, useEffect } from 'react'
    import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
    } from 'recharts'
    import { Users, Activity, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react'

    const hourlyData = [
    { time: '00시', count: 3 },
    { time: '01시', count: 1 },
    { time: '02시', count: 0 },
    { time: '03시', count: 0 },
    { time: '04시', count: 2 },
    { time: '05시', count: 1 },
    { time: '06시', count: 4 },
    { time: '07시', count: 6 },
    { time: '08시', count: 11 },
    { time: '09시', count: 18 },
    { time: '10시', count: 22 },
    { time: '11시', count: 19 },
    { time: '12시', count: 15 },
    { time: '13시', count: 21 },
    { time: '14시', count: 25 },
    { time: '15시', count: 17 },
    { time: '16시', count: 20 },
    { time: '17시', count: 14 },
    { time: '18시', count: 9 },
    { time: '19시', count: 7 },
    { time: '20시', count: 5 },
    { time: '21시', count: 4 },
    { time: '22시', count: 3 },
    { time: '23시', count: 2 },
    ]

    const statCards = [
    {
        label: '전체 유저 수',
        value: 24,
        sub: '이번 달 +3명 가입',
        icon: Users,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
    },
    {
        label: '실행 중인 파이프라인',
        value: 7,
        sub: '현재 활성 상태',
        icon: Activity,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
    },
    {
        label: '총 에러 발생',
        value: 3,
        sub: '최근 24시간 기준',
        icon: AlertTriangle,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
    },
    ]

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

    return (
        <div className="space-y-8">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-slate-900">관리자 대시보드</h1>
            <p className="text-sm text-slate-400 mt-1">시스템 전반의 현황을 확인하고 제어합니다.</p>
            </div>

            {/* 점검 모드 토글 */}
            <button onClick={onToggleMaintenance}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                maintenanceMode
                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-100'
                : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-600'
            }`}
            >
            {maintenanceMode
                ? <><ShieldAlert size={16} /> 점검 모드 ON</>
                : <><ShieldCheck size={16} /> 시스템 점검 모드</>
            }
            </button>
        </div>

        {/* 점검 모드 배너 */}
        {maintenanceMode && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-5 py-3.5 flex items-center gap-3 text-sm text-rose-700 font-medium">
            <ShieldAlert size={16} className="shrink-0" />
            시스템이 현재 점검 모드입니다. 일반 사용자의 접근이 제한됩니다.
            </div>
        )}

        {/* 스탯 카드 */}
        <div className="grid grid-cols-3 gap-5">
            {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start gap-4 shadow-sm">
                <div className={`${bg} ${color} p-3 rounded-xl`}>
                <Icon size={20} />
                </div>
                <div>
                <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
                <p className="text-3xl font-bold text-slate-900">
                    <Counter end={value} />
                    </p>
                <p className="text-xs text-slate-400 mt-1">{sub}</p>
                </div>
            </div>
            ))}
        </div>

        {/* 차트 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-base font-bold text-slate-900">파이프라인 실행 추이</h2>
                <p className="text-xs text-slate-400 mt-0.5">최근 24시간 기준</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">오늘</span>
            </div>

            <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={hourlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066ff" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0066ff" stopOpacity={0} />
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="count" stroke="#0066ff" strokeWidth={2} fill="url(#blueGrad)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
            </ResponsiveContainer>
        </div>

        </div>
    )
    }