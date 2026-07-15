import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export const SETTINGS_STORAGE_KEY = 'techbiome.settings'

export const defaultSettings = {
  themeMode: 'system',
  chartRefreshIntervalSeconds: 1,
  defaultLogView: 'all',
  timezone: 'local',
  timeFormat: '24h',
}

const THEME_MODES = new Set(['system', 'light', 'dark'])
const LOG_VIEWS = new Set(['all', 'warnings-and-errors', 'errors-only'])
const TIMEZONES = new Set(['local', 'utc'])
const TIME_FORMATS = new Set(['12h', '24h'])
const MIN_REFRESH_INTERVAL_SECONDS = 0.5
const MAX_REFRESH_INTERVAL_SECONDS = 60

const AppSettingsContext = createContext(null)

function sanitizeEnum(value, allowedValues, fallback) {
  return allowedValues.has(value) ? value : fallback
}

function sanitizeRefreshInterval(value) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return defaultSettings.chartRefreshIntervalSeconds
  }

  return Math.min(
    MAX_REFRESH_INTERVAL_SECONDS,
    Math.max(MIN_REFRESH_INTERVAL_SECONDS, Math.round(parsed * 2) / 2),
  )
}

export function sanitizeSettings(rawSettings = {}) {
  return {
    themeMode: sanitizeEnum(rawSettings.themeMode, THEME_MODES, defaultSettings.themeMode),
    chartRefreshIntervalSeconds: sanitizeRefreshInterval(rawSettings.chartRefreshIntervalSeconds),
    defaultLogView: sanitizeEnum(rawSettings.defaultLogView, LOG_VIEWS, defaultSettings.defaultLogView),
    timezone: sanitizeEnum(rawSettings.timezone, TIMEZONES, defaultSettings.timezone),
    timeFormat: sanitizeEnum(rawSettings.timeFormat, TIME_FORMATS, defaultSettings.timeFormat),
  }
}

export function readStoredSettings() {
  if (typeof window === 'undefined') {
    return defaultSettings
  }

  const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)

  if (!raw) {
    return defaultSettings
  }

  try {
    return sanitizeSettings(JSON.parse(raw))
  } catch {
    return defaultSettings
  }
}

function resolveThemeMode(themeMode) {
  if (themeMode !== 'system') {
    return themeMode
  }

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeMode(themeMode) {
  if (typeof document === 'undefined') {
    return
  }

  const resolvedTheme = resolveThemeMode(themeMode)
  const root = document.documentElement

  root.classList.toggle('dark', resolvedTheme === 'dark')
  root.dataset.themeMode = resolvedTheme
}

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => readStoredSettings())

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleStorage = (event) => {
      if (event.key === SETTINGS_STORAGE_KEY) {
        setSettings(readStoredSettings())
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    applyThemeMode(settings.themeMode)

    if (settings.themeMode !== 'system' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyThemeMode('system')

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [settings.themeMode])

  const value = useMemo(() => {
    const saveSettings = (nextSettings) => {
      const sanitizedSettings = sanitizeSettings(nextSettings)
      setSettings(sanitizedSettings)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizedSettings))
      }

      return sanitizedSettings
    }

    const resetSettings = () => saveSettings(defaultSettings)

    return {
      settings,
      saveSettings,
      resetSettings,
    }
  }, [settings])

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext)

  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider')
  }

  return context
}

export { MAX_REFRESH_INTERVAL_SECONDS, MIN_REFRESH_INTERVAL_SECONDS }