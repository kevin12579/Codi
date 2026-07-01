export default function MCPGuide() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 items-end mb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">✦</span>
                        <h1 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight">MCP 연결 가이드</h1>
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="px-3 py-1 bg-[#e6f0ff] dark:bg-blue-900/30 border border-[#bfdbfe] dark:border-blue-800 rounded-lg text-xs font-bold text-[#0066ff] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff] animate-pulse" />
                        Streamable HTTP
                    </div>
                </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">MCP-002-A</span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">MCP Inspector</h3>
                    </div>
                    <p className="text-xs text-slate-400">브라우저에서 MCP 도구를 직접 테스트할 수 있습니다.</p>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">실행 명령어</label>
                    <div className="bg-slate-900 rounded-xl px-4 py-3 font-mono text-xs text-emerald-400">
                        npx @modelcontextprotocol/inspector https://codeai.example.com/mcp
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">MCP-002-B</span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Claude Desktop</h3>
                    </div>
                    <p className="text-xs text-slate-400">claude_desktop_config.json 에 아래 설정을 추가하세요.</p>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">설정 파일</label>
                    <div className="bg-slate-900 rounded-xl px-4 py-3 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre">{`{
  "mcpServers": {
    "codi": {
      "url": "https://codeai.example.com/mcp",
      "headers": {
        "Authorization": "Bearer <JWT>"
      }
    }
  }
}`}</div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">MCP-002-C</span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Cursor</h3>
                    </div>
                    <p className="text-xs text-slate-400">Cursor Settings → MCP → Add MCP Server 에서 추가하세요.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Server URL</label>
                        <div className="bg-slate-900 rounded-xl px-4 py-3 font-mono text-xs text-emerald-400">
                            https://codeai.example.com/mcp
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Transport</label>
                        <div className="bg-slate-900 rounded-xl px-4 py-3 font-mono text-xs text-emerald-400">
                            streamable-http
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#e6f0ff] dark:bg-blue-900/20 border border-[#bfdbfe] dark:border-blue-800 rounded-2xl p-5">
                <p className="text-xs text-[#0066ff] font-semibold leading-relaxed">
                    💡 JWT 토큰은 로그인 후 발급되는 accessToken을 사용하세요. 토큰 만료 시 재로그인이 필요합니다.
                </p>
            </div>
        </div>
    )
}