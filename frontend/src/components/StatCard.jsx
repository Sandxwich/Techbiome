export default function StatCard({ label, value, unit }) {
  return (
    <div className="elevated-card flex flex-col gap-1 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-2xl font-bold text-foreground">
        {value.toFixed(1)} <span className="text-base font-normal text-muted-foreground">{unit}</span>
      </span>
    </div>
  )
}
