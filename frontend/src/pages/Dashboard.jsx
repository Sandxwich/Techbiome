import { ResponsiveContainer } from 'recharts'
import { useFakeSensorData } from '../hooks/useFakeSensorData.js'
import { useAppSettings } from '../hooks/useAppSettings.jsx'
import StatCard from '../components/StatCard'
import DataLine from '../components/linechart.jsx'

export default function Dashboard() {
    const { settings } = useAppSettings()
    const { current, history } = useFakeSensorData(settings.chartRefreshIntervalSeconds * 1000)

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Chart refreshes every {settings.chartRefreshIntervalSeconds} second{settings.chartRefreshIntervalSeconds === 1 ? '' : 's'}.</p>
            {/* These cards intentionally use generated data until the live telemetry feed is wired in. */}
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard label="Temperature" value={current.temp} unit="°C" />
                <StatCard label="Voltage" value={current.voltage} unit="V" />
                <StatCard label="RPM" value={current.rpm} unit="rpm" />
            </div>
            {/* The line chart shows the recent synthetic sensor history for layout and motion testing. */}
            <div className="elevated-card h-80 w-full rounded-xl border border-border bg-card p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <DataLine isAnimationActive={true} animationDuration={100} data={history} />
                </ResponsiveContainer>
            </div>
        </div>
    )
}
