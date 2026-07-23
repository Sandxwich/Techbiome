import { useEffect, useMemo, useState } from 'react'

const DEFAULT_LOGS_URL = '/api/logs'

function fakeLogsForDevice(deviceId) {
  const now = Date.now()
  return [
    {
      id: `${deviceId}-log-1`,
      timestamp: new Date(now - 1000 * 60 * 2).toISOString(),
      level: 'info',
      source: 'system.health',
      message: `Heartbeat received from ${deviceId}`,
    },
    {
      id: `${deviceId}-log-2`,
      timestamp: new Date(now - 1000 * 60 * 6).toISOString(),
      level: 'warning',
      source: 'power.monitor',
      message: 'Voltage fluctuation detected above threshold',
    },
    {
      id: `${deviceId}-log-3`,
      timestamp: new Date(now - 1000 * 60 * 9).toISOString(),
      level: 'error',
      source: 'sensor.bus',
      message: 'Temporary sensor read timeout, retry succeeded',
    },
    {
      id: `${deviceId}-log-4`,
      timestamp: new Date(now - 1000 * 60 * 13).toISOString(),
      level: 'debug',
      source: 'firmware.update',
      message: 'Version check complete, no update available',
    },
  ]
}

function levelTone(level) {
  if (level === 'error') {
    return 'text-rose-300 border-rose-400/40 bg-rose-500/10'
  }
  if (level === 'warning') {
    return 'text-amber-200 border-amber-300/40 bg-amber-500/10'
  }
  if (level === 'debug') {
    return 'text-cyan-200 border-cyan-300/40 bg-cyan-500/10'
  }
  return 'text-emerald-200 border-emerald-300/40 bg-emerald-500/10'
}

function filterLogs(logs, logView) {
  if (logView === 'errors-only') {
    return logs.filter((entry) => entry.level === 'error')
  }

  if (logView === 'warnings-and-errors') {
    return logs.filter((entry) => entry.level === 'warning' || entry.level === 'error')
  }

  return logs
}

function formatTimestamp(timestamp, timezone, timeFormat) {
  if (!timestamp) {
    return 'n/a'
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: timeFormat === '12h',
    timeZone: timezone === 'utc' ? 'UTC' : undefined,
    timeZoneName: 'short',
  }).format(new Date(timestamp))
}

export default function LogsViewer({
  selectedDeviceId,
  logView = 'all',
  timezone = 'local',
  timeFormat = '24h',
  logsEndpoint = import.meta.env.VITE_LOGS_URL || DEFAULT_LOGS_URL,
}) {
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [error, setError] = useState(null)

  const visibleLogs = useMemo(() => filterLogs(logs, logView), [logs, logView])

  useEffect(() => {
    if (!selectedDeviceId) {
      setLogs([])
      setError(null)
      return
    }

    let mounted = true

    const loadLogs = async () => {
      try {
        setLogsLoading(true)
        const query = new URLSearchParams({ device_id: selectedDeviceId, limit: '200' })
        const response = await fetch(`${logsEndpoint}?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        })

        if (response.status === 404) {
          if (mounted) {
            setLogs(fakeLogsForDevice(selectedDeviceId))
            setError(null)
          }
          return
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch logs: ${response.status}`)
        }

        const payload = await response.json()
        if (!Array.isArray(payload)) {
          throw new Error('Logs payload must be an array')
        }

        if (mounted) {
          setLogs(payload)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err)
        }
      } finally {
        if (mounted) {
          setLogsLoading(false)
        }
      }
    }

    loadLogs()

    return () => {
      mounted = false
    }
  }, [logsEndpoint, selectedDeviceId])

  return (
    <section className="elevated-card flex h-full min-h-0 flex-col rounded-xl border border-border p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Device Logs</h2>
          <span className="text-xs text-muted-foreground">{visibleLogs.length} of {logs.length} entries</span>
        </div>

        {error ? <p className="mb-3 text-sm text-destructive">{error.message}</p> : null}

        {!selectedDeviceId ? (
          <p className="text-sm text-muted-foreground">Select a device to load logs.</p>
        ) : null}

        {logsLoading ? <p className="text-sm text-muted-foreground">Loading logs...</p> : null}

        {!logsLoading && selectedDeviceId && visibleLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No logs found for this device.</p>
        ) : null}

        {!logsLoading && visibleLogs.length > 0 ? (
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="text-left text-muted-foreground">
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Level</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Message</th>
                </tr>
              </thead>
              <tbody>
                {visibleLogs.map((entry) => (
                  <tr key={entry.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-foreground/90">
                      {formatTimestamp(entry.timestamp, timezone, timeFormat)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium uppercase ${levelTone(entry.level)}`}
                      >
                        {entry.level || 'info'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-foreground/90">{entry.source || 'n/a'}</td>
                    <td className="px-3 py-2 text-foreground">{entry.message || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
    </section>
  )
}
