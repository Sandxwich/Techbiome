import { useEffect, useState } from 'react'

const DEFAULT_BRIGHTNESS_URL = '/api/brightness'
const DEFAULT_BRIGHTNESS_REFRESH_MS = 3000
const DEFAULT_BRIGHTNESS = 4000
const MIN_BRIGHTNESS = 0
const MAX_BRIGHTNESS = 10000
const DEFAULT_FAKE_BRIGHTNESS_STEP = 120
const DEFAULT_FAKE_TICK_MS = 1000

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function useBrightnessData({
  endpoint = import.meta.env.VITE_BRIGHTNESS_URL || DEFAULT_BRIGHTNESS_URL,
  refreshMs = Number(import.meta.env.VITE_BRIGHTNESS_REFRESH_MS) || DEFAULT_BRIGHTNESS_REFRESH_MS,
  useFakeData = String(import.meta.env.VITE_USE_FAKE_BRIGHTNESS || '').toLowerCase() === 'true',
  fakeStep = Number(import.meta.env.VITE_FAKE_BRIGHTNESS_STEP) || DEFAULT_FAKE_BRIGHTNESS_STEP,
  fakeTickMs = Number(import.meta.env.VITE_FAKE_BRIGHTNESS_TICK_MS) || DEFAULT_FAKE_TICK_MS,
  initialBrightness = Number(import.meta.env.VITE_FAKE_BRIGHTNESS_START) || DEFAULT_BRIGHTNESS,
} = {}) {
  const [brightness, setBrightness] = useState(clamp(initialBrightness, MIN_BRIGHTNESS, MAX_BRIGHTNESS))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFallbackData, setIsFallbackData] = useState(false)

  useEffect(() => {
    if (useFakeData) {
      setIsFallbackData(false)
      return
    }

    setIsFallbackData(false)
  }, [endpoint, useFakeData])

  useEffect(() => {
    if (useFakeData) {
      setLoading(false)
      setError(null)
      setIsFallbackData(false)

      const timerId = setInterval(() => {
        setBrightness((previous) => {
          const next = previous + fakeStep
          return next > MAX_BRIGHTNESS ? MIN_BRIGHTNESS : clamp(next, MIN_BRIGHTNESS, MAX_BRIGHTNESS)
        })
      }, fakeTickMs)

      return () => {
        clearInterval(timerId)
      }
    }

    let mounted = true
    let fallbackTimerId = null

    const clearFallbackTimer = () => {
      if (fallbackTimerId) {
        clearInterval(fallbackTimerId)
        fallbackTimerId = null
      }
    }

    const startFallbackStream = () => {
      if (fallbackTimerId) {
        return
      }

      setIsFallbackData(true)
      setError(null)
      setLoading(false)

      fallbackTimerId = setInterval(() => {
        setBrightness((previous) => {
          const next = previous + fakeStep
          return next > MAX_BRIGHTNESS ? MIN_BRIGHTNESS : clamp(next, MIN_BRIGHTNESS, MAX_BRIGHTNESS)
        })
      }, fakeTickMs)
    }

    const fetchBrightness = async () => {
      try {
        const response = await fetch(endpoint, {
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch brightness: ${response.status}`)
        }

        const payload = await response.json()
        const nextBrightness = Number(payload?.brightness ?? payload?.value ?? payload?.lux)

        if (!Number.isFinite(nextBrightness)) {
          throw new Error('Brightness payload must include a numeric brightness/value/lux field')
        }

        if (mounted) {
          clearFallbackTimer()
          setBrightness(clamp(nextBrightness, MIN_BRIGHTNESS, MAX_BRIGHTNESS))
          setError(null)
          setLoading(false)
          setIsFallbackData(false)
        }
      } catch (err) {
        if (mounted) {
          startFallbackStream()
          setError(err)
        }
      }
    }

    fetchBrightness()
    const timerId = setInterval(fetchBrightness, refreshMs)

    return () => {
      mounted = false
      clearInterval(timerId)
      clearFallbackTimer()
    }
  }, [endpoint, fakeStep, fakeTickMs, refreshMs, useFakeData])

  return {
    brightness,
    loading,
    error,
    isFakeData: useFakeData || isFallbackData,
    isFallbackData,
  }
}
