const MOCK_BACKEND_COMPONENTS = [
  { id: 'api', label: 'API', status: 'online' },
  { id: 'database', label: 'Database', status: 'online' },
  { id: 'mqtt', label: 'MQTT Bridge', status: 'degraded' },
  { id: 'alert-worker', label: 'Alert Worker', status: 'online' },
  { id: 'scheduler', label: 'Scheduler', status: 'offline' },
]

function statusTone(status) {
  if (status === 'online') {
    return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
  }
  if (status === 'degraded') {
    return 'border-amber-400/40 bg-amber-500/15 text-amber-200'
  }
  return 'border-rose-400/40 bg-rose-500/15 text-rose-200'
}

export default function BackendStatusOverview() {
  const offlineCount = MOCK_BACKEND_COMPONENTS.filter((item) => item.status === 'offline').length
  const degradedCount = MOCK_BACKEND_COMPONENTS.filter((item) => item.status === 'degraded').length

  return (
    <section className="elevated-card flex h-20 items-center gap-3 rounded-lg border border-foreground/20 bg-foreground/5 px-3 py-2">
      <header className="shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Backend</h3>
        <p className="text-[11px] leading-none text-muted-foreground">
          {offlineCount > 0
            ? `${offlineCount} offline`
            : degradedCount > 0
              ? `${degradedCount} degraded`
              : 'All online'}
        </p>
      </header>

      <ul className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5">
        {MOCK_BACKEND_COMPONENTS.map((component) => (
          <li key={component.id} className="flex shrink-0 items-center gap-1 rounded-md border border-border/70 bg-card/30 px-2 py-1">
            <span className="text-[11px] text-foreground">{component.label}</span>
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusTone(component.status)}`}>
              {component.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
