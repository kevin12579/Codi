import { execSync } from 'node:child_process'

const port = process.argv[2] || '5173'

const killPid = (pid) => {
    try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
    } catch {
        // Ignore failures (already terminated or insufficient permission).
    }
}

try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
        stdio: ['ignore', 'pipe', 'ignore'],
    }).toString()

    const pids = new Set(
        output
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => line.split(/\s+/).at(-1))
            .filter((pid) => /^\d+$/.test(pid))
    )

    for (const pid of pids) {
        killPid(pid)
    }
} catch {
    // findstr exits with non-zero when there is no match.
}
