import { useEffect, useState } from 'react'
import DeviceSelector from '../components/device-list.jsx'
import LogsViewer from '../components/device-log-viewer.jsx'
import Alarms from '../components/alarms.jsx'
import BackendStatusOverview from '../components/backend-status-overview.jsx'
import { useAppSettings } from '../hooks/useAppSettings.jsx'

export default function Logs() {
  const { settings } = useAppSettings()
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [logView, setLogView] = useState(settings.defaultLogView)

  useEffect(() => {
    setLogView(settings.defaultLogView)
  }, [settings.defaultLogView])

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Logs</h1>
          <p className="text-sm text-muted-foreground">Inspect device events and backend health.</p>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-foreground" htmlFor="logView">
          Log view
          <select
            id="logView"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
            value={logView}
            onChange={(event) => setLogView(event.target.value)}
          >
            <option value="all">All entries</option>
            <option value="warnings-and-errors">Warnings and errors</option>
            <option value="errors-only">Errors only</option>
          </select>
        </label>
      </div>
      {/* The top row summarizes system health before drilling into a specific device. */}
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[160px_160px_minmax(0,1fr)]">
        <Alarms label="warning" />
        <Alarms label="error" />
        <BackendStatusOverview />
      </div>
      {/* One selected device drives both the device picker and the log viewer. */}
      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[340px_minmax(0,1fr)]">
        <DeviceSelector selectedDeviceId={selectedDeviceId} onSelectDevice={setSelectedDeviceId} />
        <LogsViewer
          selectedDeviceId={selectedDeviceId}
          logView={logView}
          timezone={settings.timezone}
          timeFormat={settings.timeFormat}
        />
      </div>
    </div>
  )
}
