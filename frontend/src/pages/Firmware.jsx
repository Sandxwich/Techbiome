import { useEffect, useState } from 'react'

const FIRMWARE_ENDPOINT = '/api/firmware'

export default function Firmware() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [form, setForm] = useState({
    version: '',
    device_type: '',
    storage_key: '',
    checksum: '',
  })

  const loadFirmware = async () => {
    try {
      setLoading(true)
      const response = await fetch(FIRMWARE_ENDPOINT, { headers: { Accept: 'application/json' } })
      if (!response.ok) {
        throw new Error(`Failed to load firmware: ${response.status}`)
      }
      const payload = await response.json()
      setRows(Array.isArray(payload) ? payload : [])
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFirmware()
  }, [])

  const submitFirmware = async (event) => {
    event.preventDefault()
    setSaveMessage('')

    try {
      const response = await fetch(FIRMWARE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) {
        throw new Error(`Failed to create firmware: ${response.status}`)
      }
      setForm({ version: '', device_type: '', storage_key: '', checksum: '' })
      setSaveMessage('Firmware metadata added')
      await loadFirmware()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Firmware</h1>
        <p className="text-sm text-muted-foreground">Manage firmware metadata and OTA release targets.</p>
      </div>

      <form className="elevated-card grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2" onSubmit={submitFirmware}>
        <input
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          value={form.version}
          onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))}
          placeholder="Version (e.g. 1.2.4)"
          required
        />
        <input
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          value={form.device_type}
          onChange={(event) => setForm((current) => ({ ...current, device_type: event.target.value }))}
          placeholder="Device type"
          required
        />
        <input
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          value={form.storage_key}
          onChange={(event) => setForm((current) => ({ ...current, storage_key: event.target.value }))}
          placeholder="Object storage key"
          required
        />
        <input
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          value={form.checksum}
          onChange={(event) => setForm((current) => ({ ...current, checksum: event.target.value }))}
          placeholder="SHA-256 checksum"
          required
        />
        <div className="md:col-span-2 flex items-center gap-3">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
            Add firmware
          </button>
          {saveMessage ? <p className="text-sm text-muted-foreground">{saveMessage}</p> : null}
        </div>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading firmware...</p> : null}

      {!loading ? (
        <div className="elevated-card overflow-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-card">
              <tr className="text-left text-muted-foreground">
                <th className="px-3 py-2">Version</th>
                <th className="px-3 py-2">Device Type</th>
                <th className="px-3 py-2">Storage Key</th>
                <th className="px-3 py-2">Checksum</th>
                <th className="px-3 py-2">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 text-foreground">{row.version}</td>
                  <td className="px-3 py-2 text-foreground">{row.device_type}</td>
                  <td className="px-3 py-2 text-foreground">{row.storage_key}</td>
                  <td className="px-3 py-2 text-foreground">{row.checksum}</td>
                  <td className="px-3 py-2 text-foreground">{new Date(row.uploaded_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
