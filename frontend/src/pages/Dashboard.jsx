import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useFakeSensorData } from '../hooks/useFakeSensorData.js'
import StatCard from '../components/StatCard'

export default function Dashboard() {
    const { current, history } = useFakeSensorData()

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Temperature" value={current.temp} unit="°C" />
                <StatCard label="Voltage" value={current.voltage} unit="V" />
                <StatCard label="RPM" value={current.rpm} unit="rpm" />
            </div>

            <div className="h-80 rounded-xl border border-border bg-card p-4">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="time" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--card-foreground)',
                      }}
                    />
                    <Line type="monotone" dataKey="temp" stroke="var(--chart-1)" dot={false} strokeWidth={2} />
                </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
