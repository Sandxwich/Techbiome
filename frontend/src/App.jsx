import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Devices from './pages/Devices.jsx'
import Logs from './pages/Logs.jsx'
import Settings from './pages/Settings.jsx'
import Alerts from './pages/Alerts.jsx'
import Firmware from './pages/Firmware.jsx'
import { AppSettingsProvider } from './hooks/useAppSettings.jsx'

export default function App() {
  return (
    <AppSettingsProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="devices" element={<Devices />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="firmware" element={<Firmware />} />
          <Route path="logs" element={<Logs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AppSettingsProvider>
  )
}
