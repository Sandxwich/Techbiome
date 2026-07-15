import { TriangleAlert } from 'lucide-react'

function amount(label) {
    // TODO: fetch the amount of alarms from the backend
    if (label === 'warning') return 5
    if (label === 'error') return 3
    return 0
}

export default function Alarms({ label,}) {
    const toneClass = label === 'warning' ? 'warning' : label === 'error' ? 'error' : 'text-foreground'

    return (
        <button className="flex h-20 items-center gap-2 rounded-lg border border-foreground/20 bg-foreground/5 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10">
            {label === 'warning' && (
                <TriangleAlert className="warning shrink-0" />
            )}
            {label === 'error' && (
                <TriangleAlert className="error shrink-0" />
            )}
            <div className="flex w-full items-center justify-between">
                <span className={`text-base ${toneClass}`}>{label}</span>
                <span className={`font-semibold ${toneClass}`}>{amount(label)}</span>
            </div>
        </button>
    )
}
