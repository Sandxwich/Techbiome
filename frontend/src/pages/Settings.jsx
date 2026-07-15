import { useEffect, useState } from 'react'
import {
  defaultSettings,
  MAX_REFRESH_INTERVAL_SECONDS,
  MIN_REFRESH_INTERVAL_SECONDS,
  useAppSettings,
} from '../hooks/useAppSettings.jsx'

function toFormSettings(settings) {
  return {
    ...settings,
    chartRefreshIntervalSeconds: String(settings.chartRefreshIntervalSeconds),
  }
}

function validateSettings(formSettings) {
  const errors = {}
  const refreshInterval = Number(formSettings.chartRefreshIntervalSeconds)

  if (!Number.isFinite(refreshInterval)) {
    errors.chartRefreshIntervalSeconds = 'Enter a chart refresh interval.'
  } else if (
    refreshInterval < MIN_REFRESH_INTERVAL_SECONDS ||
    refreshInterval > MAX_REFRESH_INTERVAL_SECONDS
  ) {
    errors.chartRefreshIntervalSeconds = `Use a value between ${MIN_REFRESH_INTERVAL_SECONDS} and ${MAX_REFRESH_INTERVAL_SECONDS} seconds.`
  }

  return errors
}

export default function Settings() {
  const { settings: persistedSettings, saveSettings, resetSettings } = useAppSettings()
  const [settings, setSettings] = useState(() => toFormSettings(defaultSettings))
  const [errors, setErrors] = useState({})
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    setSettings(toFormSettings(persistedSettings))
  }, [persistedSettings])

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = validateSettings(settings)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSaveMessage('')
      return
    }

    const nextSettings = {
      ...settings,
      chartRefreshIntervalSeconds: Number(settings.chartRefreshIntervalSeconds),
    }

    const savedSettings = saveSettings(nextSettings)
    setErrors({})
    setSettings(toFormSettings(savedSettings))
    setSaveMessage('Settings saved')
  }

  const handleReset = () => {
    const resetValues = resetSettings()
    setErrors({})
    setSettings(toFormSettings(resetValues))
    setSaveMessage('Defaults restored')
  }

  const updateField = (field, value) => {
    setSaveMessage('')
    setErrors((current) => {
      if (!(field in current)) {
        return current
      }

      const nextErrors = { ...current }
      delete nextErrors[field]
      return nextErrors
    })
    setSettings((current) => ({ ...current, [field]: value }))
  }

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure dashboard and logs defaults that persist across browser sessions.</p>
      </div>

      <form className="elevated-card space-y-6 rounded-xl border border-border bg-card p-6" onSubmit={handleSubmit} noValidate>
        <section className="space-y-4 rounded-xl border border-border/70 bg-background/25 p-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Theme mode</h2>
            <p className="text-sm text-muted-foreground">Choose how the interface should resolve its color theme.</p>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-foreground" htmlFor="themeMode">
            Color theme
            <select
              id="themeMode"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
              value={settings.themeMode}
              onChange={(event) => updateField('themeMode', event.target.value)}
            >
              <option value="system">Match system</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </section>

        <section className="space-y-4 rounded-xl border border-border/70 bg-background/25 p-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Dashboard charting</h2>
            <p className="text-sm text-muted-foreground">Control how often the synthetic dashboard chart adds a new point.</p>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-foreground" htmlFor="chartRefreshIntervalSeconds">
            Chart refresh interval in seconds
            <input
              id="chartRefreshIntervalSeconds"
              className="w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
              type="number"
              min={String(MIN_REFRESH_INTERVAL_SECONDS)}
              max={String(MAX_REFRESH_INTERVAL_SECONDS)}
              step="0.5"
              value={settings.chartRefreshIntervalSeconds}
              onChange={(event) => updateField('chartRefreshIntervalSeconds', event.target.value)}
            />
          </label>
          {errors.chartRefreshIntervalSeconds ? (
            <p className="text-sm text-destructive">{errors.chartRefreshIntervalSeconds}</p>
          ) : null}
        </section>

        <section className="space-y-4 rounded-xl border border-border/70 bg-background/25 p-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Logs defaults</h2>
            <p className="text-sm text-muted-foreground">Set the initial log filtering and timestamp display used on the logs page.</p>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-foreground" htmlFor="defaultLogView">
            Default log view
            <select
              id="defaultLogView"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
              value={settings.defaultLogView}
              onChange={(event) => updateField('defaultLogView', event.target.value)}
            >
              <option value="all">All entries</option>
              <option value="warnings-and-errors">Warnings and errors</option>
              <option value="errors-only">Errors only</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-foreground" htmlFor="timezone">
            Timezone
            <select
              id="timezone"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
              value={settings.timezone}
              onChange={(event) => updateField('timezone', event.target.value)}
            >
              <option value="local">Local browser timezone</option>
              <option value="utc">UTC</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-foreground" htmlFor="timeFormat">
            Time display format
            <select
              id="timeFormat"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
              value={settings.timeFormat}
              onChange={(event) => updateField('timeFormat', event.target.value)}
            >
              <option value="24h">24-hour</option>
              <option value="12h">12-hour</option>
            </select>
          </label>
        </section>

        <div className="flex items-center gap-3">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
            Save settings
          </button>
          <button
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground"
            type="button"
            onClick={handleReset}
          >
            Reset to defaults
          </button>
          {saveMessage ? <p className="text-sm text-muted-foreground">{saveMessage}</p> : null}
        </div>
      </form>
    </section>
  )
}
