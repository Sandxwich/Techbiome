import { useEffect, useMemo, useState } from 'react'

const DEFAULT_DEVICES_URL = '/api/devices'

const FAKE_DEVICES = [
    {
        id: 'dev-sim-001',
        serial: 'SIM-AX12-001',
        device_type: 'solar-inverter',
        firmware_version: '0.9.4-sim',
        status: 'online',
    },
    {
        id: 'dev-sim-002',
        serial: 'SIM-BR77-002',
        device_type: 'wind-controller',
        firmware_version: '0.9.2-sim',
        status: 'idle',
    },
    {
        id: 'dev-sim-003',
        serial: 'SIM-CQ33-003',
        device_type: 'battery-bank',
        firmware_version: '1.0.1-sim',
        status: 'maintenance',
    },
]

export default function DeviceSelector({
    endpoint = import.meta.env.VITE_DEVICES_URL || DEFAULT_DEVICES_URL,
    selectedDeviceId,
    onSelectDevice,
}) {
    const [devices, setDevices] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let mounted = true

        const fetchDevices = async () => {
            try {
                setLoading(true)
                const response = await fetch(endpoint, {
                    headers: {
                        Accept: 'application/json',
                    },
                })

                // Fall back to sample data when the backend is not available yet.
                if (response.status === 404) {
                    if (mounted) {
                        setDevices(FAKE_DEVICES)
                        if (!selectedDeviceId && FAKE_DEVICES.length > 0) {
                            onSelectDevice?.(FAKE_DEVICES[0].id)
                        }
                        setError(null)
                    }
                    return
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch devices: ${response.status}`)
                }

                const payload = await response.json()
                if (!Array.isArray(payload)) {
                    throw new Error('Devices payload must be an array')
                }

                if (mounted) {
                    setDevices(payload)
                    if (!selectedDeviceId && payload.length > 0) {
                        onSelectDevice?.(payload[0].id)
                    }
                    setError(null)
                }
            } catch (err) {
                if (mounted) {
                    setError(err)
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        fetchDevices()

        // Avoid setting state after unmount if the fetch resolves late.
        return () => {
            mounted = false
        }
    }, [endpoint, onSelectDevice, selectedDeviceId])

    const filteredDevices = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase()
        if (!normalized) {
            return devices
        }

        return devices.filter((device) => {
            const searchable = [
                device.id,
                device.serial,
                device.device_type,
                device.firmware_version,
                device.status,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()

            return searchable.includes(normalized)
        })
    }, [devices, searchTerm])

    return (
        <section className="elevated-card flex h-full min-h-0 flex-col rounded-xl border border-border p-4 md:p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Select Device</h2>
                    <p className="text-sm text-muted-foreground">{filteredDevices.length} results</p>
                </div>
                <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by serial, type, status, firmware, or id"
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none md:max-w-md"
                    aria-label="Search devices"
                />
            </div>

            {loading ? <p className="text-sm text-muted-foreground">Loading devices...</p> : null}

            {error ? (
                <p className="text-sm text-destructive">Could not load devices. {error.message}</p>
            ) : null}

            {!loading && !error && filteredDevices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No devices found for your search.</p>
            ) : null}

            {!loading && !error && filteredDevices.length > 0 ? (
                <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
                    {filteredDevices.map((device) => {
                        const active = selectedDeviceId === device.id
                        return (
                            <button
                                key={device.id}
                                type="button"
                                onClick={() => onSelectDevice?.(device.id)}
                                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                                    active
                                        ? 'border-accent bg-accent/20 text-foreground'
                                        : 'border-border bg-card text-foreground/90 hover:border-accent/60 hover:bg-card/80'
                                }`}
                            >
                                <div className="font-medium">{device.serial}</div>
                                <div className="text-xs text-muted-foreground">
                                    {device.device_type} • {device.status || 'unknown'}
                                </div>
                            </button>
                        )
                    })}
                </div>
            ) : null}
        </section>
    )
}


export function DeviceOverview({ endpoint = import.meta.env.VITE_DEVICES_URL || DEFAULT_DEVICES_URL }) {
    const [devices, setDevices] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let mounted = true

        const fetchDevices = async () => {
            try {
                setLoading(true)
                const response = await fetch(endpoint, {
                    headers: {
                        Accept: 'application/json',
                    },
                })

                // Keep the overview usable with fixture data during local development.
                if (response.status === 404) {
                    if (mounted) {
                        setDevices(FAKE_DEVICES)
                        setError(null)
                    }
                    return
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch devices: ${response.status}`)
                }

                const payload = await response.json()
                if (!Array.isArray(payload)) {
                    throw new Error('Devices payload must be an array')
                }

                if (mounted) {
                    setDevices(payload)
                    setError(null)
                }
            } catch (err) {
                if (mounted) {
                    setError(err)
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        fetchDevices()

        // Same guard as above: prevents stale async updates on navigation away.
        return () => {
            mounted = false
        }
    }, [endpoint])

    return (
        <div>
            <header className="mb-4">
                <h2 className="text-xl font-semibold text-foreground">Device Overview</h2>
                <p className="text-sm text-muted-foreground">{devices.length} devices</p>
            </header>
            {loading ? <p className="text-sm text-muted-foreground">Loading devices...</p> : null}

            {error ? (
                <p className="text-sm text-destructive">Could not load devices. {error.message}</p>
            ) : null}

            {!loading && !error && devices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No devices available.</p>
            ) : null}

            {!loading && !error && devices.length > 0 ? (
                <ul className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
                    {devices.map((device) => (
                        <li key={device.id}>
                            <article className="rounded-lg border border-border bg-card p-4 text-foreground/90">
                                <header className="mb-3 flex items-start justify-between gap-2">
                                    <h3 className="text-base font-semibold text-foreground">{device.serial || device.id}</h3>
                                    <span className="rounded-md border border-border bg-foreground/5 px-2 py-0.5 text-xs uppercase tracking-wide text-foreground">
                                        {device.status || 'unknown'}
                                    </span>
                                </header>
                                <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
                                    <dt className="text-muted-foreground">Device ID</dt>
                                    <dd className="truncate text-right text-foreground">{device.id || 'n/a'}</dd>
                                    <dt className="text-muted-foreground">Type</dt>
                                    <dd className="text-right text-foreground">{device.device_type || 'n/a'}</dd>
                                    <dt className="text-muted-foreground">FW Version</dt>
                                    <dd className="text-right text-foreground">{device.firmware_version || 'n/a'}</dd>
                                </dl>
                            </article>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    )
}
