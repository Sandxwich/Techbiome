import { ResponsiveContainer } from 'recharts'
import { useFakeSensorData } from '../hooks/useFakeSensorData.js'
import StatCard from '../components/StatCard'
import DataLine from '../components/linechart.jsx'

export default function Dashboard() {
    const { current, history } = useFakeSensorData()

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard label="Temperature" value={current.temp} unit="°C" />
                <StatCard label="Voltage" value={current.voltage} unit="V" />
                <StatCard label="RPM" value={current.rpm} unit="rpm" />
            </div>
            <div className="h-80 w-full rounded-xl border border-border bg-card p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <DataLine isAnimationActive={true} animationDuration={100} data={history} />
                </ResponsiveContainer>
            </div>
        </div>
    )
}
