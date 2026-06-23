    import { useState, useEffect } from 'react'
    import apiClient from '../../api/client'

    export default function MCPTools() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        apiClient.get('/mcp/tools')
        .then(res => {
            if (res.data.success) setData(res.data.data)
            else setError(res.data.error?.message || '불러오기 실패')
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }, [])

    return (
        <div className="space-y-6">
        <div className="grid grid-cols-2 items-end mb-2">
            <div className="space-y-1">
            <div className="flex items-center gap-2">
                <span className="text-xl">✦</span>
                <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">MCP 도구 목록</h1>
            </div>
            </div>
            <div className="flex justify-end">
            <div className="px-3 py-1 bg-[#e6f0ff] border border-[#bfdbfe] rounded-lg text-xs font-bold text-[#0066ff] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff] animate-pulse" />
                {loading ? '불러오는 중...' : `${data?.tools?.length ?? 0}개 도구`}
            </div>
            </div>
        </div>

        <hr className="border-slate-200" />

        {!loading && data && (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">서버명</label>
                <input type="text" value={data.serverName} readOnly
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono focus:outline-none cursor-default" />
                </div>
                <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">버전</label>
                <input type="text" value={data.version} readOnly
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono focus:outline-none cursor-default" />
                </div>
                <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Transport</label>
                <input type="text" value={data.transport} readOnly
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono focus:outline-none cursor-default" />
                </div>
                <div className="md:col-span-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Endpoint</label>
                <input type="text" value={data.endpoint} readOnly
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono focus:outline-none cursor-default" />
                </div>
            </div>
            </div>
        )}

        {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>}
        {loading && <div className="flex items-center justify-center h-48 text-sm text-slate-400">불러오는 중...</div>}

        {!loading && data?.tools && (
            <div className="space-y-3">
            {data.tools.map((tool) => (
                <div key={tool.name} className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white bg-[#0066ff] px-2 py-0.5 rounded-lg font-mono">{tool.name}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{tool.description}</p>
                {tool.parameters && Object.keys(tool.parameters).length > 0 && (
                    <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parameters</p>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(tool.parameters).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                            <span className="text-[10px] font-black text-slate-700 font-mono">{key}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{val.type}</span>
                            {val.enum && <span className="text-[10px] text-[#0066ff] font-mono">[{val.enum.join(' | ')}]</span>}
                        </div>
                        ))}
                    </div>
                    </div>
                )}
                </div>
            ))}
            </div>
        )}
        </div>
    )
    }