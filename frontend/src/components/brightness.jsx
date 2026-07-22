import { useMemo } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useBrightnessData } from '../hooks/useBrightnessData.js'

const MIN_BRIGHTNESS = 0
const MAX_BRIGHTNESS = 10000

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default function BrightnessWidget({ endpoint, refreshMs }) {
  const { brightness, loading, error, isFakeData, isFallbackData } = useBrightnessData({ endpoint, refreshMs })

  const normalizedBrightness = useMemo(() => {
    return clamp((brightness - MIN_BRIGHTNESS) / (MAX_BRIGHTNESS - MIN_BRIGHTNESS), 0, 1)
  }, [brightness])

  const iconStyle = useMemo(() => {
    const opacity = 0.35 + normalizedBrightness * 0.65
    const glow = 4 + normalizedBrightness * 16
    const scale = 0.92 + normalizedBrightness * 0.12

    return {
      opacity,
      transform: `scale(${scale})`,
      color: `hsl(${48 + normalizedBrightness * 8} 95% ${62 - normalizedBrightness * 10}%)`,
      filter: `drop-shadow(0 0 ${glow}px rgba(255, 212, 95, ${0.2 + normalizedBrightness * 0.55}))`,
      transition: 'opacity 220ms ease, transform 220ms ease, filter 220ms ease, color 220ms ease',
    }
  }, [normalizedBrightness])

  return (
    <div>
      <div className="flex h-full flex-col items-center justify-center">
        {/* Brightness icon reacts to normalized value to show daylight intensity. */}
        {normalizedBrightness < 0.08 ? (
          <Moon size={140} className="icons gap-4" style={iconStyle} />
        ) : (
          <Sun size={140} className="icons align-middle" style={iconStyle} />
        )}
      </div>

      <p className="mt-3 text-center text-sm text-muted-foreground">Brightness: {Math.round(brightness)}</p>
      {isFakeData && !isFallbackData && <p className="text-center text-xs text-muted-foreground">Demo mode: simulated brightness</p>}
      {isFallbackData && <p className="text-center text-xs text-yellow-400">Backend unavailable. Showing simulated brightness.</p>}
      {loading && <p className="text-center text-xs text-muted-foreground">Loading brightness...</p>}
      {error && !isFallbackData && <p className="text-center text-xs text-red-400">{error.message}</p>}
    </div>
  )
}
