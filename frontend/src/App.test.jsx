import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from './test/renderApp.jsx'
import { SETTINGS_STORAGE_KEY, defaultSettings } from './hooks/useAppSettings.jsx'

function jsonResponse(body, init = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: vi.fn().mockResolvedValue(body),
  }
}

function deferred() {
  let resolve
  let reject

  const promise = new Promise((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })

  return { promise, resolve, reject }
}

function installDefaultFetchMock(overrides = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input) => {
      const url = String(input)

      if (url.includes('/api/devices/count')) {
        return Promise.resolve(overrides.count ?? jsonResponse({ count: 12 }))
      }

      if (url.includes('/devices')) {
        return Promise.resolve(
          overrides.devices ??
            jsonResponse([
              {
                id: 'dev-001',
                serial: 'SIM-AX12-001',
                device_type: 'solar-inverter',
                firmware_version: '0.9.4-sim',
                status: 'online',
              },
            ]),
        )
      }

      if (url.includes('/logs')) {
        return Promise.resolve(overrides.logs ?? jsonResponse([]))
      }

      return Promise.reject(new Error(`Unhandled fetch request: ${url}`))
    }),
  )
}

const sampleLogs = [
  {
    id: 'dev-001-log-1',
    timestamp: '2026-07-15T08:00:00.000Z',
    level: 'info',
    source: 'system.health',
    message: 'Heartbeat received',
  },
  {
    id: 'dev-001-log-2',
    timestamp: '2026-07-15T08:01:00.000Z',
    level: 'warning',
    source: 'power.monitor',
    message: 'Voltage fluctuation detected',
  },
  {
    id: 'dev-001-log-3',
    timestamp: '2026-07-15T08:02:00.000Z',
    level: 'error',
    source: 'sensor.bus',
    message: 'Temporary sensor read timeout',
  },
  {
    id: 'dev-001-log-4',
    timestamp: '2026-07-15T08:03:00.000Z',
    level: 'debug',
    source: 'firmware.update',
    message: 'Version check complete',
  },
]

describe('route smoke tests', () => {
  beforeEach(() => {
    installDefaultFetchMock()
  })

  it.each([
    ['/', 'Dashboard'],
    ['/logs', 'Logs'],
    ['/settings', 'Settings'],
  ])('renders %s without crashing', async (path, heading) => {
    renderApp([path])

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
  })
})

describe('settings persistence', () => {
  it('reads stored settings, writes updates, and restores them on remount', async () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        themeMode: 'light',
        chartRefreshIntervalSeconds: 2.5,
        defaultLogView: 'warnings-and-errors',
        timezone: 'utc',
        timeFormat: '12h',
      }),
    )

    installDefaultFetchMock()
    const user = userEvent.setup()
    const firstRender = renderApp(['/settings'])

    const themeModeInput = await screen.findByLabelText(/color theme/i)
    const intervalInput = screen.getByLabelText(/chart refresh interval in seconds/i)
    const defaultLogViewInput = screen.getByLabelText(/default log view/i)
    const timezoneInput = screen.getByLabelText(/timezone/i)
    const timeFormatInput = screen.getByLabelText(/time display format/i)

    expect(themeModeInput).toHaveValue('light')
    expect(intervalInput).toHaveValue(2.5)
    expect(defaultLogViewInput).toHaveValue('warnings-and-errors')
    expect(timezoneInput).toHaveValue('utc')
    expect(timeFormatInput).toHaveValue('12h')

    await user.selectOptions(themeModeInput, 'dark')
    await user.clear(intervalInput)
    await user.type(intervalInput, '5')
    await user.selectOptions(defaultLogViewInput, 'errors-only')
    await user.selectOptions(timezoneInput, 'local')
    await user.selectOptions(timeFormatInput, '24h')
    await user.click(screen.getByRole('button', { name: /save settings/i }))

    expect(await screen.findByText('Settings saved')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY))).toEqual({
      themeMode: 'dark',
      chartRefreshIntervalSeconds: 5,
      defaultLogView: 'errors-only',
      timezone: 'local',
      timeFormat: '24h',
    })

    firstRender.unmount()
    renderApp(['/settings'])

    expect(await screen.findByLabelText(/color theme/i)).toHaveValue('dark')
    expect(screen.getByLabelText(/chart refresh interval in seconds/i)).toHaveValue(5)
    expect(screen.getByLabelText(/default log view/i)).toHaveValue('errors-only')
    expect(screen.getByLabelText(/timezone/i)).toHaveValue('local')
    expect(screen.getByLabelText(/time display format/i)).toHaveValue('24h')
  })

  it('validates invalid values and can reset preferences to defaults', async () => {
    installDefaultFetchMock()
    const user = userEvent.setup()

    renderApp(['/settings'])

    const intervalInput = await screen.findByLabelText(/chart refresh interval in seconds/i)

    await user.clear(intervalInput)
    await user.type(intervalInput, '100')
    await user.click(screen.getByRole('button', { name: /save settings/i }))

    expect(await screen.findByText(/use a value between 0.5 and 60 seconds/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reset to defaults/i }))

    expect(await screen.findByText('Defaults restored')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY))).toEqual(defaultSettings)
    expect(screen.getByLabelText(/color theme/i)).toHaveValue(defaultSettings.themeMode)
    expect(screen.getByLabelText(/chart refresh interval in seconds/i)).toHaveValue(defaultSettings.chartRefreshIntervalSeconds)
  })
})

describe('settings consumers', () => {
  it('applies stored preferences to dashboard and logs', async () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        themeMode: 'dark',
        chartRefreshIntervalSeconds: 2,
        defaultLogView: 'warnings-and-errors',
        timezone: 'utc',
        timeFormat: '24h',
      }),
    )

    installDefaultFetchMock({
      logs: jsonResponse(sampleLogs),
    })

    renderApp(['/'])

    expect(await screen.findByText(/chart refreshes every 2 seconds/i)).toBeInTheDocument()

    renderApp(['/logs'])

    expect(await screen.findByLabelText(/log view/i)).toHaveValue('warnings-and-errors')
    expect(await screen.findByText('Voltage fluctuation detected')).toBeInTheDocument()
    expect(screen.getByText('Temporary sensor read timeout')).toBeInTheDocument()
    expect(screen.queryByText('Heartbeat received')).not.toBeInTheDocument()
    expect(screen.queryByText('Version check complete')).not.toBeInTheDocument()
    expect(screen.getAllByText(/utc/i)).toHaveLength(2)
  })
})

describe('device count async states', () => {
  it('shows loading before the device count resolves and then renders the count', async () => {
    const pendingCount = deferred()

    installDefaultFetchMock({
      count: pendingCount.promise,
    })

    renderApp(['/'])

    expect(screen.getByText('...')).toBeInTheDocument()

    pendingCount.resolve(jsonResponse({ count: 27 }))

    expect(await screen.findByText('27')).toBeInTheDocument()
    expect(screen.getByText(/devices on the grid/i)).toBeInTheDocument()
  })

  it('shows an error label when the device count request fails', async () => {
    installDefaultFetchMock({
      count: { ok: false, status: 503, json: vi.fn() },
    })

    renderApp(['/'])

    await waitFor(() => {
      expect(screen.getByText(/data unavailable/i)).toBeInTheDocument()
    })
  })
})
