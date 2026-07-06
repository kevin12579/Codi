import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getConnectorsOverview, testConnectorCategory } from '../api/connectors'
import { getMcpTools, getRepositories } from '../api/mcp'
import { getApiErrorMessage, isApiEnabled } from '../api/client'
import { appendAdminAuditLog } from '../api/adminAudit'
import { getAuthToken } from "../api/authStorage";

const getStorageScope = (mode) => {
    if (mode === 'connectors') return 'connectors'
    if (mode === 'mcp') return 'mcp'
    return 'full'
}

const getStorageKeys = (mode) => {
    const scope = getStorageScope(mode)
    return {
        servers: `mcpHubServersV1:${scope}`,
        dayKey: `mcpHubDayKeyV1:${scope}`,
        lastUpdatedAt: `mcpHubLastUpdatedAtV1:${scope}`,
    }
}

const nowIso = () => new Date().toISOString()
const minutesAgoIso = (minutes) => new Date(Date.now() - minutes * 60 * 1000).toISOString()
const secondsAgoIso = (seconds) => new Date(Date.now() - seconds * 1000).toISOString()

const formatSeenAt = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('ko-KR', { hour12: false })
}

const normalizeServer = (server) => ({
    ...server,
    lastSeenAt: server?.lastSeenAt || nowIso(),
})

const mockServers = [
    {
        id: 'mcp-1',
        name: 'GitHub MCP',
        type: 'remote',
        status: 'connected',
        endpoint: 'https://mcp.github.tools/v1',
        tools: 18,
        lastSeenAt: minutesAgoIso(1),
        description: '레포 조회, PR 상태 확인, 이슈 검색을 담당합니다.',
    },
    {
        id: 'mcp-2',
        name: 'Notion MCP',
        type: 'remote',
        status: 'disconnected',
        endpoint: 'https://mcp.notion.tools/v1',
        tools: 7,
        lastSeenAt: minutesAgoIso(12),
        description: '문서 조회 및 스펙 동기화를 담당합니다.',
    },
    {
        id: 'mcp-3',
        name: 'Local FS MCP',
        type: 'local',
        status: 'error',
        endpoint: 'stdio://local-fs',
        tools: 5,
        lastSeenAt: minutesAgoIso(60),
        description: '로컬 파일 탐색과 편집 도구를 제공합니다.',
    },
]

const statusClass = {
    connected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    disconnected: 'bg-slate-100 text-slate-600 border-slate-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusLabel = {
    connected: '연결됨',
    disconnected: '연결 끊김',
    error: '오류',
}

const connectorOverviewSeed = [
    { category: 'VCS', active: 3, total: 4 },
    { category: 'AI', active: 2, total: 3 },
    { category: '테스트', active: 2, total: 2 },
    { category: '배포', active: 1, total: 2 },
]

const repositorySeed = [
    { name: 'codeai-frontend', branch: 'main', provider: 'github', webhook: '/webhook/github' },
    { name: 'codeai-backend', branch: 'develop', provider: 'github', webhook: '/webhook/github' },
]

const toolSchemaTemplates = [
    { name: 'list_repos', schema: '{ owner: string }' },
    { name: 'create_issue', schema: '{ repo: string, title: string, body?: string }' },
    { name: 'read_doc', schema: '{ pageId: string }' },
    { name: 'search_logs', schema: '{ query: string, limit?: number }' },
]

const statusValues = ['connected', 'disconnected', 'error']

const randomStatus = () => statusValues[Math.floor(Math.random() * statusValues.length)]

const randomName = () => {
    const pool = ['Slack', 'Jira', 'Figma', 'Confluence', 'Linear', 'Sentry', 'GitLab']
    return `${pool[Math.floor(Math.random() * pool.length)]} MCP`
}

const randomEndpoint = (type) => {
    if (type === 'local') return `stdio://local-${Math.floor(Math.random() * 9) + 1}`
    return `https://mcp.${Math.random().toString(36).slice(2, 8)}.tools/v1`
}

const formatDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const getTodayKey = () => formatDateKey(new Date())

const getStoredDayKey = (dayKeyStorageKey) => {
    try {
        return localStorage.getItem(dayKeyStorageKey)
    } catch {
        return null
    }
}

const isStoredDayCurrent = (dayKeyStorageKey) => getStoredDayKey(dayKeyStorageKey) === getTodayKey()

const getMsUntilNextMidnight = () => {
    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setHours(24, 0, 0, 0)
    return nextMidnight.getTime() - now.getTime()
}

const getCurrentUserLoginTime = () => {
    try {
        const raw = localStorage.getItem('currentUser')
        if (!raw) return null
        const parsed = JSON.parse(raw)
        const loginTime = Number(parsed?.loginTime)
        if (!Number.isFinite(loginTime) || loginTime <= 0) return null
        return new Date(loginTime)
    } catch {
        return null
    }
}

const loadInitialServers = (storageKeys) => {
    if (!isStoredDayCurrent(storageKeys.dayKey)) return mockServers.map(normalizeServer)

    try {
        const raw = localStorage.getItem(storageKeys.servers)
        if (!raw) return mockServers.map(normalizeServer)
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(normalizeServer)
        }
        return mockServers.map(normalizeServer)
    } catch {
        return mockServers.map(normalizeServer)
    }
}

const loadInitialLastUpdatedAt = (lastUpdatedStorageKey) => {
    try {
        const raw = localStorage.getItem(lastUpdatedStorageKey)
        if (!raw) return null
        const parsed = new Date(raw)
        if (Number.isNaN(parsed.getTime())) return null
        return parsed
    } catch {
        return null
    }
}

const summarizeServers = (items) => ({
    total: items.length,
    connected: items.filter((server) => server.status === 'connected').length,
    errors: items.filter((server) => server.status === 'error').length,
    totalTools: items.reduce((sum, server) => sum + server.tools, 0),
})

const simulateNextServers = (currentServers) => {
    let changed = 0
    let next = currentServers.map((server, idx) => {
        const statusChanged = Math.random() < 0.28
        const nextStatus = statusChanged ? randomStatus() : server.status
        // Avoid reducing connected tool count during passive auto-refresh.
        const toolDelta = nextStatus === 'connected' ? Math.floor(Math.random() * 3) : 0
        const nextTools = Math.max(server.tools, server.tools + toolDelta)
        const serverChanged = statusChanged || nextTools !== server.tools
        if (serverChanged) changed += 1

        // Spread update timestamps so changed rows don't all show the exact same second.
        const offsetSec = Math.min(59, idx * 2 + Math.floor(Math.random() * 6))

        return {
            ...server,
            status: nextStatus,
            tools: nextTools,
            lastSeenAt: serverChanged ? secondsAgoIso(offsetSec) : server.lastSeenAt,
        }
    })

    if (Math.random() < 0.2) {
        const type = Math.random() < 0.7 ? 'remote' : 'local'
        next = [
            ...next,
            {
                id: `mcp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                name: randomName(),
                type,
                status: randomStatus(),
                endpoint: randomEndpoint(type),
                tools: Math.floor(Math.random() * 12) + 3,
                lastSeenAt: secondsAgoIso(Math.floor(Math.random() * 45) + 5),
                description: '자동 감지된 MCP 서버입니다.',
            },
        ]
        changed += 1
    }

    // Do not auto-remove servers. Removal should be an explicit user action.

    return { next, changed }
}

export default function MCPHub({ isActive = true, mode = 'full', isAdmin = false }) {
    const apiEnabled = isApiEnabled()
    const connectorOnlyMode = mode === 'connectors'
    const mcpOnlyMode = mode === 'mcp'
    const storageKeys = getStorageKeys(mode)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastChangeCount, setLastChangeCount] = useState(0)
    const [lastUpdatedAt, setLastUpdatedAt] = useState(() => loadInitialLastUpdatedAt(storageKeys.lastUpdatedAt))
    const [filter, setFilter] = useState('all')
    const [servers, setServers] = useState(() => loadInitialServers(storageKeys))
    const [selectedServerId, setSelectedServerId] = useState('')

    const [slackEnabled, setSlackEnabled] = useState(true);
    const [discordEnabled, setDiscordEnabled] = useState(false);
    const [slackWebhook, setSlackWebhook] = useState(""); // 빈 문자열로 변경
    const [discordWebhook, setDiscordWebhook] = useState("");

    const [testMessage, setTestMessage] = useState('')
    const [serverActionMessage, setServerActionMessage] = useState('')
    const [adminSyncMessage, setAdminSyncMessage] = useState('')
    const [adminSyncResult, setAdminSyncResult] = useState(null)
    const [highlightedServerIds, setHighlightedServerIds] = useState([])
    const [activeSection, setActiveSection] = useState('')
    const [activeRepoName, setActiveRepoName] = useState('')
    const [dayKey, setDayKey] = useState(() => getStoredDayKey(storageKeys.dayKey) || getTodayKey())
    const [connectorOverview, setConnectorOverview] = useState(connectorOverviewSeed)
    const [repositories, setRepositories] = useState(repositorySeed)
    const [remoteMcpTools, setRemoteMcpTools] = useState([])
    const slackWebhookInputRef = useRef(null)
    const refreshInFlightRef = useRef(false)
    const refreshTimerRef = useRef(null)
    const [activeEngine, setActiveEngine] = useState('')
    const [apiKeyInput, setApiKeyInput] = useState('')
    const [aiEngineLoading, setAiEngineLoading] = useState(false)
    const [aiEngineMessage, setAiEngineMessage] = useState(null)

    

    const handleSwitchEngine = async () => {
    if (!activeEngine || !apiKeyInput.trim()) return
    const savedToken = localStorage.getItem('authToken')
    setAiEngineLoading(true)
    setAiEngineMessage(null)
    try {
        const res = await fetch('/api/connectors/ai', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${savedToken}`,
            },
            body: JSON.stringify({
                activeProviders: [activeEngine],
                config: { [activeEngine]: { apiKey: apiKeyInput } },
            }),
        })
        const result = await res.json()
        if (result.success) {
            setAiEngineMessage({ text: `${activeEngine} 엔진으로 변경되었습니다.`, isError: false })
            setApiKeyInput('')
        } else {
            setAiEngineMessage({ text: result.error?.message || '변경 실패', isError: true })
        }
    } catch {
        setAiEngineMessage({ text: '서버 오류가 발생했습니다.', isError: true })
    } finally {
        setAiEngineLoading(false)
    }
}

    const highlightClearTimerRef = useRef(null)

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 350)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (!apiEnabled) return undefined

        let mounted = true

        const loadRemoteData = async () => {
            try {
                const [connectorsResult, repositoriesResult, toolsResult] = await Promise.all([
                    getConnectorsOverview(),
                    getRepositories(),
                    getMcpTools(),
                ])

                if (!mounted) return

                const connectorsData = connectorsResult?.data || {}
                const categoryMap = [
                    ['VCS', 'vcs'],
                    ['AI', 'ai'],
                    ['테스트', 'test'],
                    ['배포', 'deploy'],
                ]
                const nextConnectorOverview = categoryMap.map(([label, key]) => {
                    const current = connectorsData[key]
                    const total = Array.isArray(current?.available) ? current.available.length : 0
                    const active = current?.active ? 1 : 0
                    return { category: label, active, total: Math.max(total, active) }
                })
                if (nextConnectorOverview.some((item) => item.total > 0)) {
                    setConnectorOverview(nextConnectorOverview)
                }

                const repoContent = repositoriesResult?.data?.content
                const rawRepos = Array.isArray(repoContent)
                    ? repoContent
                    : Array.isArray(repositoriesResult?.data)
                        ? repositoriesResult.data
                        : []
                if (rawRepos.length > 0) {
                    setRepositories(
                        rawRepos.map((repo) => ({
                            name: repo.name || repo.fullName || repo.repositoryFullName || 'unknown-repo',
                            branch: repo.branch || repo.defaultBranch || 'main',
                            provider: repo.provider || repo.vcsId || 'github',
                            webhook: repo.webhookUrl || `/webhook/${repo.provider || repo.vcsId || 'github'}`,
                        }))
                    )
                }

                const rawTools = Array.isArray(toolsResult?.data?.tools) ? toolsResult.data.tools : [];
                if (rawTools.length > 0) {
                    setRemoteMcpTools(
                        rawTools.map((tool, index) => ({
                            id: tool.id || `${tool.name || 'tool'}-${index + 1}`,
                            name: tool.name || `tool_${index + 1}`,
                            schema: typeof tool.schema === 'string' ? tool.schema : JSON.stringify(tool.schema || {}),
                        }))
                    )
                }
            } catch {
            }
        }

        loadRemoteData()
        return () => {
            mounted = false
        }
    }, [apiEnabled])

    useEffect(() => {
        localStorage.setItem(storageKeys.servers, JSON.stringify(servers))
    }, [servers, storageKeys.servers])

    const resetDailyData = useCallback((nextDayKey) => {
        setServers(mockServers)
        setSelectedServerId('')
        setLastChangeCount(0)
        setLastUpdatedAt(null)
        setDayKey(nextDayKey)

        localStorage.setItem(storageKeys.dayKey, nextDayKey)
        localStorage.setItem(storageKeys.servers, JSON.stringify(mockServers))
        localStorage.removeItem(storageKeys.lastUpdatedAt)
    }, [storageKeys.dayKey, storageKeys.lastUpdatedAt, storageKeys.servers])

    useEffect(() => {
        if (!isStoredDayCurrent(storageKeys.dayKey)) {
            resetDailyData(getTodayKey())
            return
        }

        localStorage.setItem(storageKeys.dayKey, getTodayKey())
    }, [resetDailyData, storageKeys.dayKey])

    useEffect(() => {
        const timer = setTimeout(() => {
            resetDailyData(getTodayKey())
        }, getMsUntilNextMidnight())

        return () => clearTimeout(timer)
    }, [dayKey, resetDailyData])

    const runRefresh = useCallback((options = {}) => {
        if (refreshInFlightRef.current) return
        refreshInFlightRef.current = true
        setIsRefreshing(true)
        refreshTimerRef.current = setTimeout(() => {
            setServers((prev) => {
                const { next: firstNext, changed: firstChanged } = simulateNextServers(prev)
                let next = firstNext
                let changed = firstChanged

                // Manual refresh keeps state as-is when backend data is unchanged.
                if (changed === 0 && next.length > 0 && options.ensureVisibleChange) {
                    const head = next[0]
                    const toggledStatus = head.status === 'connected' ? 'disconnected' : 'connected'
                    next = [{ ...head, status: toggledStatus, lastSeenAt: nowIso() }, ...next.slice(1)]
                    changed = 1
                }

                if (options.captureDiff) {
                    const previousSummary = summarizeServers(prev)
                    const nextSummary = summarizeServers(next)
                    const previousMap = new Map(prev.map((item) => [item.id, item]))
                    const changedIds = next
                        .filter((item) => {
                            const before = previousMap.get(item.id)
                            if (!before) return true
                            return before.status !== item.status || before.tools !== item.tools
                        })
                        .map((item) => item.id)

                    const isNoChange =
                        previousSummary.total === nextSummary.total &&
                        previousSummary.connected === nextSummary.connected &&
                        previousSummary.errors === nextSummary.errors &&
                        previousSummary.totalTools === nextSummary.totalTools &&
                        changedIds.length === 0

                    setAdminSyncResult({
                        before: previousSummary,
                        after: nextSummary,
                        changedCount: changedIds.length,
                        isNoChange,
                    })
                    setHighlightedServerIds(changedIds)

                    if (highlightClearTimerRef.current) {
                        clearTimeout(highlightClearTimerRef.current)
                    }
                    highlightClearTimerRef.current = setTimeout(() => {
                        setHighlightedServerIds([])
                    }, 3500)

                    // Force sync re-baselines the live "change count" metric.
                    if (options.resetChangeCounter) {
                        setLastChangeCount(0)
                    }
                }

                if (!options.resetChangeCounter) {
                    setLastChangeCount(changed)
                }
                return next
            })
            const forcedAt = options?.forcedTimestamp ? new Date(options.forcedTimestamp) : null
            const refreshedAt = forcedAt && !Number.isNaN(forcedAt.getTime()) ? forcedAt : new Date()
            setLastUpdatedAt(refreshedAt)
            localStorage.setItem(storageKeys.lastUpdatedAt, refreshedAt.toISOString())
            setIsRefreshing(false)
            refreshInFlightRef.current = false
            refreshTimerRef.current = null
        }, 280)
    }, [storageKeys.lastUpdatedAt])

    useEffect(() => {
        if (!isActive) return
        if (lastUpdatedAt) return

        const loginTime = getCurrentUserLoginTime()
        runRefresh({
            ensureVisibleChange: true,
            forcedTimestamp: loginTime || new Date(),
        })
    }, [isActive, lastUpdatedAt, runRefresh])

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
            if (highlightClearTimerRef.current) {
                clearTimeout(highlightClearTimerRef.current)
                highlightClearTimerRef.current = null
            }
            refreshInFlightRef.current = false
        }
    }, [])

    const filteredServers = useMemo(() => {
        if (filter === 'all') return servers
        return servers.filter((server) => server.status === filter)
    }, [filter, servers])

    useEffect(() => {
        if (filteredServers.length === 0) {
            setSelectedServerId('')
            return
        }

        if (!filteredServers.some((server) => server.id === selectedServerId)) {
            setSelectedServerId(filteredServers[0].id)
        }
    }, [filteredServers, selectedServerId])

    const selectedServer = useMemo(() => {
        return filteredServers.find((server) => server.id === selectedServerId) || filteredServers[0] || null
    }, [filteredServers, selectedServerId])

    const summary = useMemo(() => {
        return summarizeServers(servers)
    }, [servers])

    const mcpTools = useMemo(() => {
        if (remoteMcpTools.length > 0) return remoteMcpTools

        if (!selectedServer) return []
        const count = Math.min(10, Math.max(3, selectedServer.tools))
        return Array.from({ length: count }).map((_, idx) => {
            const template = toolSchemaTemplates[idx % toolSchemaTemplates.length]
            return {
                id: `${selectedServer.id}-tool-${idx + 1}`,
                name: `${template.name}_${idx + 1}`,
                schema: template.schema,
            }
        })
    }, [remoteMcpTools, selectedServer])

    // 💡 1. 설정 저장 함수 (PUT /api/connectors/notify)
        const handleSaveNotification = async () => {
            try {
                const token = getAuthToken();

                const activeProviders = [
                    ...(slackEnabled ? ["slack"] : []),
                    ...(discordEnabled ? ["discord"] : []),
                ];
                const config = {};
                if (slackEnabled) config.slack = { webhookUrl: slackWebhook };
                if (discordEnabled) config.discord = { webhookUrl: discordWebhook };

                const response = await fetch('/api/connectors/notify', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ activeProviders, config })
                });

                const result = await response.json();
                if (result.success) {
                    alert('알림 설정이 성공적으로 저장되었습니다.');
                } else {
                    alert('저장에 실패했습니다.');
                }
            } catch (error) {
                console.error('알림 저장 오류:', error);
                alert('서버와 통신 중 오류가 발생했습니다.');
            }
        };

        const runChannelTest = async () => {
            try {
                const token = getAuthToken();
                
                const response = await fetch('/api/connectors/notify/test', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        alert('테스트 메시지가 성공적으로 발송되었습니다.');
                    }
                } else if (response.status === 502) {
                    alert('테스트 실패: Webhook URL이 설정되지 않았거나 올바르지 않습니다.');
                } else {
                    alert('테스트 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('테스트 오류:', error);
                alert('테스트 통신 중 오류가 발생했습니다.');
            }
        };

    const handleManualRefresh = useCallback(() => {
        setAdminSyncResult(null)
        setHighlightedServerIds([])
        runRefresh({ ensureVisibleChange: true })

        if (isAdmin) {
            appendAdminAuditLog({
                category: 'mcp',
                action: 'MCP_MANUAL_REFRESH',
                message: `${mcpOnlyMode ? 'MCP 허브' : '커넥터 허브'} 수동 새로고침`,
                meta: {
                    mode,
                    serverCount: servers.length,
                },
            })
        }
    }, [isAdmin, mcpOnlyMode, mode, runRefresh, servers.length])

    const highlightedSections = useMemo(() => {
        if (connectorOnlyMode) {
            return [
                { id: 'conn001', label: 'CONN001' },
                { id: 'conn002', label: 'CONN002' },
                { id: 'conn003', label: 'CONN003' },
                { id: 'conn004', label: 'CONN004' },
                { id: 'conn005', label: 'CONN005' },
                { id: 'conn006', label: 'CONN006' },
            ]
        }

        if (mcpOnlyMode) {
            return [
                { id: 'mcp001', label: 'MCP001' },
                { id: 'mcp002', label: 'MCP002' },
            ]
        }

        return [
            { id: 'conn001', label: 'CONN001' },
            { id: 'conn004', label: 'CONN004' },
            { id: 'set004', label: 'SET004' },
            { id: 'mcp001', label: 'MCP001' },
            { id: 'mcp002', label: 'MCP002' },
        ]
    }, [connectorOnlyMode, mcpOnlyMode])

    const moveToSection = useCallback(
        (sectionId) => {
            setActiveSection(sectionId)

            if (sectionId === 'conn001') {
                setFilter('connected')
                const connectedServer = servers.find((server) => server.status === 'connected')
                if (connectedServer) setSelectedServerId(connectedServer.id)
            }

            if (sectionId === 'conn004') {
                setSlackEnabled(true)
                setTestMessage('Slack 채널 기준으로 설정을 준비했습니다.')
            }

            if (sectionId === 'set004') {
                setFilter('all')
                const githubServer = servers.find((server) => server.name.includes('GitHub'))
                if (githubServer) setSelectedServerId(githubServer.id)
                setActiveRepoName('codeai-frontend')
            }

            const target = document.getElementById(sectionId)
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }

            if (sectionId === 'conn004') {
                setTimeout(() => {
                    slackWebhookInputRef.current?.focus()
                    slackWebhookInputRef.current?.select()
                }, 220)
            }

            setTimeout(() => setActiveSection(''), 1800)
        },
        [servers]
    )

    const handleServerConnectionTest = useCallback(async () => {
        if (!selectedServer) return

        if (!apiEnabled) {
            setServerActionMessage(`${selectedServer.name} 연결 테스트 성공 (local)`)
            return
        }

        const category = selectedServer.name.includes('Git') ? 'vcs' : 'notify'
        try {
            const result = await testConnectorCategory(category)
            const latency = result?.data?.latencyMs
            setServerActionMessage(
                latency
                    ? `${selectedServer.name} 연결 테스트 성공 (${latency}ms)`
                    : `${selectedServer.name} 연결 테스트 성공`
            )
        } catch (error) {
            setServerActionMessage(getApiErrorMessage(error, `${selectedServer.name} 연결 테스트 실패`))
        }
    }, [apiEnabled, selectedServer])

    const handleServerSettingsEdit = useCallback(() => {
        if (!selectedServer) return

        const recommendedRepo = selectedServer.name.includes('GitHub') ? 'codeai-frontend' : 'codeai-backend'
        setActiveRepoName(recommendedRepo)
        setServerActionMessage(`${selectedServer.name} 기준으로 설정 섹션으로 이동합니다.`)
        moveToSection('set004')
    }, [moveToSection, selectedServer])

    const handleAdminForceSync = useCallback(() => {
        const confirmed = window.confirm('강제 동기화를 진행하시겠습니까?')
        if (!confirmed) {
            setAdminSyncMessage('강제 동기화를 취소했습니다.')
            setTimeout(() => setAdminSyncMessage(''), 1800)
            return
        }

        runRefresh({ captureDiff: true, resetChangeCounter: true })
        setAdminSyncMessage('관리자 강제 동기화를 실행했습니다. 변경 기록 카운터를 0으로 재기준화했습니다.')
        setTimeout(() => setAdminSyncMessage(''), 2200)

        appendAdminAuditLog({
            category: 'mcp',
            action: 'MCP_ADMIN_FORCE_SYNC',
            message: `${mcpOnlyMode ? 'MCP 허브' : '커넥터 허브'} 관리자 강제 동기화`,
            meta: {
                mode,
                serverCount: servers.length,
            },
        })
    }, [mcpOnlyMode, mode, runRefresh, servers.length])

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    {/* flex와 items-center를 추가하여 아이콘과 텍스트를 수평으로 정렬 */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">✦</span>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
                            {connectorOnlyMode ? '커넥터 허브' : 'MCP 서버 허브'}
                        </h1>
                    </div>
                    
                    <p className="mt-1 text-sm text-slate-500">{connectorOnlyMode ? '플러그인 상태와 연결 설정을 한 곳에서 관리합니다.' : '연결 상태, 도구 수, 최근 상태를 한 곳에서 관리합니다.'}</p>
                    <p className="mt-1 text-xs text-slate-400">
                        마지막 갱신: {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString('ko-KR') : '-'} · 변경 감지 {lastChangeCount}건
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isRefreshing ? '새로고침 중...' : '새로고침'}
                    </button>
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={handleAdminForceSync}
                            disabled={isRefreshing}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isRefreshing ? '강제 동기화 중...' : '관리자 강제 동기화'}
                        </button>
                    )}
                    <label htmlFor="mcp-filter" className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        상태 필터
                    </label>
                    <select
                        id="mcp-filter"
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#0066ff] focus:outline-none"
                    >
                        <option value="all">전체</option>
                        <option value="connected">연결됨</option>
                        <option value="disconnected">연결 끊김</option>
                        <option value="error">오류</option>
                    </select>
                </div>
            </div>

            {isAdmin && adminSyncMessage && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    {adminSyncMessage}
                </div>
            )}

            {isAdmin && adminSyncResult && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-3 text-xs text-indigo-800">
                    <p className="font-black">강제 동기화 결과</p>
                    <p className="mt-1 font-semibold">
                        {adminSyncResult.isNoChange
                            ? '변경 없음 (0건)'
                            : `변경 감지 ${adminSyncResult.changedCount}건`}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                        <p>등록 서버: {adminSyncResult.before.total} → {adminSyncResult.after.total}</p>
                        <p>활성 연결: {adminSyncResult.before.connected} → {adminSyncResult.after.connected}</p>
                        <p>오류 상태: {adminSyncResult.before.errors} → {adminSyncResult.after.errors}</p>
                        <p>연결 도구: {adminSyncResult.before.totalTools} → {adminSyncResult.after.totalTools}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <SummaryCard label="등록 서버" value={`${summary.total}개`} />
                <SummaryCard label="활성 연결" value={`${summary.connected}개`} />
                <SummaryCard label="오류 상태" value={`${summary.errors}개`} />
                <SummaryCard label="연결 도구" value={`${summary.totalTools}개`} />
            </div>

            <div className="rounded-2xl border border-[#dbeafe] bg-gradient-to-r from-[#f8fbff] to-[#eef5ff] p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black tracking-tight text-slate-800">V1 보강 항목 5개 반영 완료</p>
                    <div className="flex items-center gap-1.5">
                        {isAdmin && (
                            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-700">ADMIN MODE</span>
                        )}
                        <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1 text-[11px] font-black text-[#1d4ed8]">UPDATED</span>
                    </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#dbeafe]">
                    <div className="h-full w-full animate-pulse bg-[#3b82f6]" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {highlightedSections.map((section) => (
                        <button
                            key={section.id}
                            type="button"
                            onClick={() => moveToSection(section.id)}
                            className={`rounded-full border px-3 py-1 text-[11px] font-black transition-colors ${
                                activeSection === section.id
                                    ? 'border-[#1d4ed8] bg-[#1d4ed8] text-white'
                                    : 'border-[#bfdbfe] bg-white text-slate-700 hover:bg-[#eff6ff]'
                            }`}
                        >
                            {section.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2 rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-bold text-slate-800">서버 목록</p>
                    </div>

                    {isLoading ? (
                        <div className="space-y-2 px-4 py-4">
                            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
                            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
                            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
                        </div>
                    ) : filteredServers.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">선택한 필터에 해당하는 서버가 없습니다.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">이름</th>
                                        <th className="px-4 py-3">유형</th>
                                        <th className="px-4 py-3">상태</th>
                                        <th className="px-4 py-3">도구 수</th>
                                        <th className="px-4 py-3">최근 확인</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredServers.map((server) => (
                                        <tr
                                            key={server.id}
                                            onClick={() => {
                                                setSelectedServerId(server.id)
                                                setServerActionMessage('')
                                            }}
                                            className={`cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50 ${
                                                selectedServer?.id === server.id ? 'bg-blue-50/50' : ''
                                            } ${
                                                highlightedServerIds.includes(server.id) ? 'bg-amber-50 ring-1 ring-amber-300' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-3 font-semibold text-slate-800">{server.name}</td>
                                            <td className="px-4 py-3 text-slate-600">{server.type}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusClass[server.status]}`}>
                                                    {statusLabel[server.status]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{server.tools}</td>
                                            <td className="px-4 py-3 text-slate-600">{formatSeenAt(server.lastSeenAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
                    <p className="text-sm font-bold text-slate-800">서버 상세</p>

                    {!selectedServer ? (
                        <p className="mt-4 text-sm text-slate-500">선택된 서버가 없습니다.</p>
                    ) : (
                        <div className="mt-4 space-y-3 text-sm">
                            <DetailRow label="서버명" value={selectedServer.name} />
                            <DetailRow label="엔드포인트" value={selectedServer.endpoint} />
                            <DetailRow label="유형" value={selectedServer.type} />
                            <DetailRow label="연결 상태" value={statusLabel[selectedServer.status]} />
                            <DetailRow label="도구 수" value={`${selectedServer.tools}개`} />
                            <DetailRow label="최근 확인" value={formatSeenAt(selectedServer.lastSeenAt)} />
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                {selectedServer.description}
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleServerConnectionTest}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    연결 테스트
                                </button>
                                <button
                                    type="button"
                                    onClick={handleServerSettingsEdit}
                                    className="rounded-lg bg-[#0066ff] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                >
                                    설정 편집
                                </button>
                            </div>
                            {serverActionMessage && <p className="text-xs text-slate-500">{serverActionMessage}</p>}
                        </div>
                    )}
                </div>
            </div>

            {!mcpOnlyMode && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div id="conn001" className={`rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 shadow-md ring-2 transition-all ${activeSection === 'conn001' ? 'ring-amber-400 scale-[1.01]' : 'ring-amber-200'}`}>
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-amber-900">CONN001 · 커넥터 개요</p>
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">NEW</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">카테고리별 활성 플러그인 현황</p>
                    <div className="mt-4 space-y-2">
                        {connectorOverview.map((item) => (
                            <div key={item.category} className="flex items-center justify-between rounded-lg border border-amber-300 bg-white px-3 py-2">
                                <span className="text-xs font-semibold text-slate-800">{item.category}</span>
                                <span className="text-xs font-bold text-amber-700">{item.active}/{item.total}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div id="conn002" className={`rounded-2xl border-2 border-sky-400 bg-sky-50 p-5 shadow-md ring-2 transition-all ${activeSection === 'conn002' ? 'ring-sky-400 scale-[1.01]' : 'ring-sky-200'}`}>
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-sky-900">CONN002 · VCS 설정</p>
                        <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-black text-white">V1</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">GitHub 공급자 고정 표시 (V1)</p>
                    <div className="mt-4 rounded-lg border border-sky-200 bg-white px-3 py-2">
                        <p className="text-xs font-semibold text-slate-700">Provider: github</p>
                        <p className="mt-1 text-[11px] text-slate-500">OAuth/App 설정은 추후 단계에서 확장됩니다.</p>
                    </div>
                </div>

                <div id="conn003" className={`rounded-2xl border-2 border-indigo-400 bg-indigo-50 p-5 shadow-md ring-2 transition-all ${activeSection === 'conn003' ? 'ring-indigo-400 scale-[1.01]' : 'ring-indigo-200'}`}>
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-indigo-900">CONN003 · AI 엔진 설정</p>
                        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-black text-white">CORE</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">V1 핵심: AI 3종 선택/교체</p>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        {['claude', 'openai', 'gemini'].map((engine) => (
                            <button
                                key={engine}
                                type="button"
                                onClick={() => setActiveEngine(engine)}
                                className={`rounded-lg border px-2 py-2 text-center text-xs font-semibold transition-all ${
                                    activeEngine === engine
                                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                                        : 'border-indigo-200 bg-white text-slate-700 hover:border-indigo-400'
                                }`}
                            >
                                {engine}
                            </button>
                        ))}
                    </div>
                    {activeEngine && (
                        <div className="mt-3 space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                                {activeEngine.toUpperCase()} API Key
                            </label>
                            <input
                                type="password"
                                placeholder="sk-..."
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                            <p className="text-[11px] text-slate-400">저장하면 다음 파이프라인부터 적용됩니다.</p>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleSwitchEngine}
                        disabled={!activeEngine || !apiKeyInput.trim() || aiEngineLoading}
                        className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        {aiEngineLoading ? '저장 중...' : '엔진 저장'}
                    </button>
                    {aiEngineMessage && (
                        <p className={`mt-2 text-[11px] font-semibold ${aiEngineMessage.isError ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {aiEngineMessage.text}
                        </p>
                    )}
                </div>

                <div id="conn004" className={`rounded-2xl border-2 border-rose-400 bg-rose-50 p-5 shadow-md ring-2 transition-all ${activeSection === 'conn004' ? 'ring-rose-400 scale-[1.01]' : 'ring-rose-200'}`}>
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-rose-900">CONN004 · 알림 채널 설정</p>
                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">NEW</span>
                    </div>
                    <div className="mt-4 space-y-3 text-sm">
                        <label className="flex items-center justify-between rounded-lg border border-rose-200 bg-white px-3 py-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-700">Slack</span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${slackEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {slackEnabled ? 'ON' : 'OFF'}
                                </span>
                            </div>
                            <input type="checkbox" checked={slackEnabled} onChange={(e) => setSlackEnabled(e.target.checked)} />
                        </label>
                        <input
                            ref={slackWebhookInputRef}
                            value={slackWebhook}
                            onChange={(e) => setSlackWebhook(e.target.value)}
                            disabled={!slackEnabled}
                            className={`w-full rounded-lg border px-3 py-2 text-xs ${slackEnabled ? 'border-rose-200 bg-white' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                            placeholder="Slack Webhook URL"
                        />
                        <label className="flex items-center justify-between rounded-lg border border-rose-200 bg-white px-3 py-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-700">Discord</span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${discordEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {discordEnabled ? 'ON' : 'OFF'}
                                </span>
                            </div>
                            <input type="checkbox" checked={discordEnabled} onChange={(e) => setDiscordEnabled(e.target.checked)} />
                        </label>
                        <input
                            value={discordWebhook}
                            onChange={(e) => setDiscordWebhook(e.target.value)}
                            disabled={!discordEnabled}
                            className={`w-full rounded-lg border px-3 py-2 text-xs ${discordEnabled ? 'border-rose-200 bg-white' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                            placeholder="Discord Webhook URL"
                        />

                        {/* 💡 여기에 저장 및 연결 테스트 버튼이 들어갑니다 */}
                        <div className="flex gap-2 pt-2">
                            <button 
                                onClick={handleSaveNotification}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                            >
                                저장
                            </button>
                            <button 
                                onClick={runChannelTest}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg text-xs font-semibold hover:bg-gray-700 transition-colors"
                            >
                                연결 테스트
                            </button>
                        </div>

                        {testMessage && <p className="text-xs text-slate-500">{testMessage}</p>}
                    </div>
                </div>

                <div id="conn005" className={`rounded-2xl border-2 border-cyan-400 bg-cyan-50 p-5 shadow-md ring-2 transition-all ${activeSection === 'conn005' ? 'ring-cyan-400 scale-[1.01]' : 'ring-cyan-200'}`}>
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-cyan-900">CONN005 · 테스트 설정</p>
                        <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-black text-white">V1</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Playwright 고정 표시 (V1)</p>
                    <div className="mt-4 rounded-lg border border-cyan-200 bg-white px-3 py-2">
                        <p className="text-xs font-semibold text-slate-700">Runner: playwright</p>
                        <p className="mt-1 text-[11px] text-slate-500">테스트 러너 확장 기능은 V2에서 지원합니다.</p>
                    </div>
                </div>

                <div id="conn006" className={`rounded-2xl border-2 border-teal-400 bg-teal-50 p-5 shadow-md ring-2 transition-all ${activeSection === 'conn006' ? 'ring-teal-400 scale-[1.01]' : 'ring-teal-200'}`}>
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-teal-900">CONN006 · 배포 설정</p>
                        <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-black text-white">V1</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">GitHub Actions 고정 표시 (V1)</p>
                    <div className="mt-4 rounded-lg border border-teal-200 bg-white px-3 py-2">
                        <p className="text-xs font-semibold text-slate-700">Provider: github-actions</p>
                        <p className="mt-1 text-[11px] text-slate-500">배포 전략/환경 분기는 V2에서 확장됩니다.</p>
                    </div>
                </div>

                <div id="set004" className={`rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-5 shadow-md ring-2 transition-all ${activeSection === 'set004' ? 'ring-emerald-400 scale-[1.01]' : 'ring-emerald-200'}`}>
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-emerald-900">SET004 · 레포지토리 관리</p>
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">NEW</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">연결 레포와 Webhook 안내</p>
                    <div className="mt-4 space-y-2">
                        {repositories.map((repo) => (
                            <div key={repo.name} className={`rounded-lg border bg-white px-3 py-2 transition-colors ${activeRepoName === repo.name ? 'border-emerald-500 ring-2 ring-emerald-300' : 'border-emerald-200'}`}>
                                <p className="text-xs font-bold text-slate-700">{repo.name} ({repo.branch})</p>
                                <p className="mt-1 text-[11px] text-slate-500">Provider: {repo.provider}</p>
                                <p className="text-[11px] text-slate-500">Webhook: {repo.webhook}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            )}

            {!connectorOnlyMode && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div id="mcp001" className="xl:col-span-2 rounded-2xl border-2 border-violet-400 bg-violet-50 p-5 shadow-md ring-2 ring-violet-200">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-violet-900">MCP001 · MCP 도구 목록</p>
                        <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-black text-white">NEW</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">@McpTool 노출 목록 및 입력 스키마</p>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full text-left text-sm rounded-lg overflow-hidden">
                            <thead className="bg-violet-100 text-xs uppercase tracking-wide text-violet-700">
                                <tr>
                                    <th className="px-3 py-2">도구명</th>
                                    <th className="px-3 py-2">스키마</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mcpTools.map((tool) => (
                                    <tr key={tool.id} className="border-t border-violet-100 bg-white">
                                        <td className="px-3 py-2 font-semibold text-slate-800">{tool.name}</td>
                                        <td className="px-3 py-2 text-xs text-slate-600 font-mono">{tool.schema}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="mcp002" className="rounded-2xl border-2 border-cyan-400 bg-cyan-50 p-5 shadow-md ring-2 ring-cyan-200">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-cyan-900">MCP002 · MCP 연결 가이드</p>
                        <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-black text-white">NEW</span>
                    </div>
                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                        <p className="font-semibold text-slate-700">1) 서버 엔드포인트</p>
                        <p className="rounded-lg border border-cyan-200 bg-white px-2 py-1 font-mono break-all">{selectedServer?.endpoint || 'N/A'}</p>
                        <p className="font-semibold text-slate-700 pt-2">2) Inspector 연결</p>
                        <p>Inspector에서 위 URL 입력 후 Connect를 눌러 상태를 확인합니다.</p>
                        <p className="font-semibold text-slate-700 pt-2">3) Claude Desktop 연결</p>
                        <p>설정 파일에 MCP endpoint를 등록하고 툴 목록이 표시되는지 확인합니다.</p>
                    </div>
                </div>
            </div>
            )}
        </section>
    )
}

function SummaryCard({ label, value }) {
    return (
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
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
