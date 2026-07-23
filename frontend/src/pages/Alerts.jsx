import { useEffect, useState } from 'react'

const ALERTS_ENDPOINT = '/api/alerts'
const RULES_ENDPOINT = '/api/alerts/rules'

export default function Alerts() {
  const [activeAlerts, setActiveAlerts] = useState([])
  const [rules, setRules] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    device_id: '',
    metric: '',
    operator: 'gt',
    threshold: '',
    severity: 'warning',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [alertsRes, rulesRes] = await Promise.all([
        fetch(ALERTS_ENDPOINT, { headers: { Accept: 'application/json' } }),
        fetch(RULES_ENDPOINT, { headers: { Accept: 'application/json' } }),
      ])

      if (!alertsRes.ok || !rulesRes.ok) {
        throw new Error('Failed to load alerts data')
      }

      const alertsPayload = await alertsRes.json()
      const rulesPayload = await rulesRes.json()
      setActiveAlerts(Array.isArray(alertsPayload) ? alertsPayload : [])
      setRules(Array.isArray(rulesPayload) ? rulesPayload : [])
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const submitRule = async (event) => {
    event.preventDefault()
    try {
      const response = await fetch(RULES_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...form,
          device_id: form.device_id || null,
          threshold: Number(form.threshold),
        }),
      })
      if (!response.ok) {
        throw new Error(`Failed to create alert rule: ${response.status}`)
      }

      setForm({
        device_id: '',
        metric: '',
        operator: 'gt',
        threshold: '',
        severity: 'warning',
      })
      await loadData()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
        <p className="text-sm text-muted-foreground">Inspect active alerts and manage alert rules.</p>
      </div>

      <form className="elevated-card grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-3" onSubmit={submitRule}>
        <input
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          value={form.device_id}
          onChange={(event) => setForm((current) => ({ ...current, device_id: event.target.value }))}
          placeholder="Device ID (optional)"
        />
        <input
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          value={form.metric}
          onChange={(event) => setForm((current) => ({ ...current, metric: event.target.value }))}
          placeholder="Metric key (e.g. temp)"
          required
        />
        <input
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          type="number"
          value={form.threshold}
          onChange={(event) => setForm((current) => ({ ...current, threshold: event.target.value }))}
          placeholder="Threshold"
          required
        />
        <select
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          value={form.operator}
          onChange={(event) => setForm((current) => ({ ...current, operator: event.target.value }))}
        >
          <option value="gt">gt</option>
          <option value="lt">lt</option>
          <option value="eq">eq</option>
          <option value="neq">neq</option>
        </select>
        <select
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          value={form.severity}
          onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))}
        >
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="critical">critical</option>
        </select>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
          Add rule
        </button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading alerts...</p> : null}

      {!loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="elevated-card rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Active Alerts ({activeAlerts.length})</h2>
            <ul className="space-y-2 text-sm text-foreground">
              {activeAlerts.map((item) => (
                <li key={item.id} className="rounded-md border border-border p-2">
                  <div className="font-medium">Device {item.device_id}</div>
                  <div className="text-muted-foreground">Rule {item.rule_id}</div>
                  <div className="text-muted-foreground">Value {item.value}</div>
                </li>
              ))}
              {activeAlerts.length === 0 ? <li className="text-muted-foreground">No active alerts.</li> : null}
            </ul>
          </section>

          <section className="elevated-card rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Alert Rules ({rules.length})</h2>
            <ul className="space-y-2 text-sm text-foreground">
              {rules.map((item) => (
                <li key={item.id} className="rounded-md border border-border p-2">
                  <div className="font-medium">
                    {item.metric} {item.operator} {item.threshold}
                  </div>
                  <div className="text-muted-foreground">Severity {item.severity}</div>
                  <div className="text-muted-foreground">Device {item.device_id || 'all devices'}</div>
                </li>
              ))}
              {rules.length === 0 ? <li className="text-muted-foreground">No rules yet.</li> : null}
            </ul>
          </section>
        </div>
      ) : null}
    </section>
  )
}
