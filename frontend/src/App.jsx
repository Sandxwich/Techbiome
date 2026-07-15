import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Devices from './pages/Devices.jsx'
import Logs from './pages/Logs.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="devices" element={<Devices />} />
        <Route path="logs" element={<Logs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
