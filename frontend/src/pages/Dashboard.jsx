import { ResponsiveContainer } from 'recharts'
import { useFakeSensorData } from '../hooks/useFakeSensorData.js'
import StatCard from '../components/StatCard'
import DataLine from '../components/linechart.jsx'
import BrightnessWidget from '../components/brightness.jsx'

export default function Dashboard() {
    const { current, history } = useFakeSensorData()

    return (
        <div className="flex flex-col gap-6">
            {/* These cards intentionally use generated data until the live telemetry feed is wired in. */}
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard label="Temperature" value={current.temp} unit="°C" />
                <StatCard label="Voltage" value={current.voltage} unit="V" />
                <StatCard label="RPM" value={current.rpm} unit="rpm" />
            </div>
            {/* The line chart shows the recent synthetic sensor history for layout and motion testing. */}
            <div className="grid grid-cols-5 gap-4">
                <div className="elevated-card w-full h-80 rounded-xl border border-border bg-card p-4 col-span-3 row-span-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <DataLine isAnimationActive={true} animationDuration={100} data={history} />
                    </ResponsiveContainer>
                </div>
                <div className="elevated-card w-full h-80 rounded-xl border border-border bg-card p-4 col-span-2 row-span-1">
                    <BrightnessWidget />
                </div>
            </div>
        </div>
    )
}
