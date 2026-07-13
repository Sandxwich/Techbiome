import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export default function DataLine({
  data = [],
  isAnimationActive = true,
  animationDuration = 100,
  animationEasing = 'linear',
}) {
  return (
    <AreaChart
      data={data}
      margin={{
        top: 5,
        right: 10,
        left: 0,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
      <XAxis dataKey="time" stroke="var(--muted-foreground)" />
      <YAxis width="auto" stroke="var(--muted-foreground)" />
      <Tooltip
        cursor={{
          stroke: 'var(--border)',
        }}
        contentStyle={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--card-foreground)',
        }}
      />
      <Legend />
      <Area
        type="monotone"
        dataKey="temp"
        stroke="var(--chart-1)"
        fill="var(--chart-1)"
        dot={false}
        isAnimationActive={isAnimationActive}
        animationDuration={animationDuration}
        animationEasing={animationEasing}
        fillOpacity={0.3}
      />
      <Area
        type="monotone"
        dataKey="voltage"
        stroke="var(--chart-2)"
        fill="var(--chart-2)"
        dot={false}
        isAnimationActive={isAnimationActive}
        animationDuration={animationDuration}
        animationEasing={animationEasing}
        fillOpacity={0.3}
      />
      <Area
        type="monotone"
        dataKey="rpm"
        stroke="var(--chart-3)"
        fill="var(--chart-3)"
        dot={false}
        isAnimationActive={isAnimationActive}
        animationDuration={animationDuration}
        animationEasing={animationEasing}
        fillOpacity={0.3}
      />
    </AreaChart>
  )
}
