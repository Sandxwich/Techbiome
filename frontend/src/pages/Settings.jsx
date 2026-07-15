import { useEffect, useState } from 'react'

const SETTINGS_STORAGE_KEY = 'techbiome.settings'

const defaultSettings = {
  apiBaseUrl: '/api',
  autoRefresh: true,
  refreshIntervalSeconds: 10,
}

function toFormSettings(settings) {
  return {
    ...settings,
    refreshIntervalSeconds: String(settings.refreshIntervalSeconds),
  }
}

function readStoredSettings() {
  if (typeof window === 'undefined') {
    return defaultSettings
  }

  const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)

  if (!raw) {
    return defaultSettings
  }

  try {
    const parsed = JSON.parse(raw)

    return {
      apiBaseUrl:
        typeof parsed.apiBaseUrl === 'string' && parsed.apiBaseUrl.trim().length > 0
          ? parsed.apiBaseUrl
          : defaultSettings.apiBaseUrl,
      autoRefresh: typeof parsed.autoRefresh === 'boolean' ? parsed.autoRefresh : defaultSettings.autoRefresh,
      refreshIntervalSeconds:
        Number.isFinite(Number(parsed.refreshIntervalSeconds)) && Number(parsed.refreshIntervalSeconds) > 0
          ? Number(parsed.refreshIntervalSeconds)
          : defaultSettings.refreshIntervalSeconds,
    }
  } catch {
    return defaultSettings
  }
}

export default function Settings() {
  const [settings, setSettings] = useState(() => toFormSettings(defaultSettings))
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    setSettings(toFormSettings(readStoredSettings()))
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()

    const persistedSettings = {
      ...settings,
      refreshIntervalSeconds:
        Number.isFinite(Number(settings.refreshIntervalSeconds)) && Number(settings.refreshIntervalSeconds) > 0
          ? Number(settings.refreshIntervalSeconds)
          : defaultSettings.refreshIntervalSeconds,
    }

    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(persistedSettings))
    setSettings(toFormSettings(persistedSettings))
    setSaveMessage('Settings saved')
  }

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure frontend defaults that should persist across browser sessions.</p>
      </div>

      <form className="elevated-card space-y-5 rounded-xl border border-border bg-card p-6" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium text-foreground" htmlFor="apiBaseUrl">
          API base URL
          <input
            id="apiBaseUrl"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
            type="text"
            value={settings.apiBaseUrl}
            onChange={(event) => {
              setSaveMessage('')
              setSettings((current) => ({ ...current, apiBaseUrl: event.target.value }))
            }}
          />
        </label>

        <label className="flex items-center gap-3 text-sm font-medium text-foreground" htmlFor="autoRefresh">
          <input
            id="autoRefresh"
            className="h-4 w-4 rounded border-border text-primary"
            type="checkbox"
            checked={settings.autoRefresh}
            onChange={(event) => {
              setSaveMessage('')
              setSettings((current) => ({ ...current, autoRefresh: event.target.checked }))
            }}
          />
          Enable automatic refresh
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-foreground" htmlFor="refreshIntervalSeconds">
          Refresh interval in seconds
          <input
            id="refreshIntervalSeconds"
            className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
            type="number"
            min="1"
            step="1"
            value={settings.refreshIntervalSeconds}
            onChange={(event) => {
              setSaveMessage('')
              setSettings((current) => ({
                ...current,
                refreshIntervalSeconds: event.target.value,
              }))
            }}
          />
        </label>

        <div className="flex items-center gap-3">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
            Save settings
          </button>
          {saveMessage ? <p className="text-sm text-muted-foreground">{saveMessage}</p> : null}
        </div>
      </form>
    </section>
  )
}

export { SETTINGS_STORAGE_KEY, defaultSettings, readStoredSettings }
