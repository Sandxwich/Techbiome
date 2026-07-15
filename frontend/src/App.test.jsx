import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from './test/renderApp.jsx'
import { SETTINGS_STORAGE_KEY } from './pages/Settings.jsx'

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
        apiBaseUrl: '/seeded-api',
        autoRefresh: false,
        refreshIntervalSeconds: 30,
      }),
    )

    installDefaultFetchMock()
    const user = userEvent.setup()
    const firstRender = renderApp(['/settings'])

    const apiBaseUrlInput = await screen.findByLabelText(/api base url/i)
    const autoRefreshCheckbox = screen.getByLabelText(/enable automatic refresh/i)
    const intervalInput = screen.getByLabelText(/refresh interval in seconds/i)

    expect(apiBaseUrlInput).toHaveValue('/seeded-api')
    expect(autoRefreshCheckbox).not.toBeChecked()
    expect(intervalInput).toHaveValue(30)

    await user.clear(apiBaseUrlInput)
    await user.type(apiBaseUrlInput, '/updated-api')
    await user.click(autoRefreshCheckbox)
    await user.clear(intervalInput)
    await user.type(intervalInput, '45')
    await user.click(screen.getByRole('button', { name: /save settings/i }))

    expect(await screen.findByText('Settings saved')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY))).toEqual({
      apiBaseUrl: '/updated-api',
      autoRefresh: true,
      refreshIntervalSeconds: 45,
    })

    firstRender.unmount()
    renderApp(['/settings'])

    expect(await screen.findByLabelText(/api base url/i)).toHaveValue('/updated-api')
    expect(screen.getByLabelText(/enable automatic refresh/i)).toBeChecked()
    expect(screen.getByLabelText(/refresh interval in seconds/i)).toHaveValue(45)
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
