import { useState } from 'react'
import DeviceSelector from '../components/device-list.jsx'
import LogsViewer from '../components/device-log-viewer.jsx'
import Alarms from '../components/alarms.jsx'
import BackendStatusOverview from '../components/backend-status-overview.jsx'

export default function Logs() {
  const [selectedDeviceId, setSelectedDeviceId] = useState('')

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[160px_160px_minmax(0,1fr)]">
        <Alarms label="warning" />
        <Alarms label="error" />
        <BackendStatusOverview />
      </div>
      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[340px_minmax(0,1fr)]">
        <DeviceSelector selectedDeviceId={selectedDeviceId} onSelectDevice={setSelectedDeviceId} />
        <LogsViewer selectedDeviceId={selectedDeviceId} />
      </div>
    </div>
  )
}
