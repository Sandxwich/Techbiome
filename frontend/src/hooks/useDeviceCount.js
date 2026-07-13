import { useEffect, useState } from 'react'

const DEFAULT_COUNT_URL = '/api/devices/count'
const DEFAULT_REFRESH_MS = 10000

export function useDeviceCount({
  endpoint = import.meta.env.VITE_DEVICE_COUNT_URL || DEFAULT_COUNT_URL,
  refreshMs = Number(import.meta.env.VITE_DEVICE_COUNT_REFRESH_MS) || DEFAULT_REFRESH_MS,
} = {}) {
  const [count, setCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const fetchCount = async () => {
      try {
        const response = await fetch(endpoint, {
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch device count: ${response.status}`)
        }

        const payload = await response.json()
        const nextCount = Number(payload?.count)

        if (!Number.isFinite(nextCount)) {
          throw new Error('Device count payload must include numeric count')
        }

        if (mounted) {
          setCount(nextCount)
          setError(null)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err)
          setLoading(false)
        }
      }
    }

    fetchCount()
    const timerId = setInterval(fetchCount, refreshMs)

    return () => {
      mounted = false
      clearInterval(timerId)
    }
  }, [endpoint, refreshMs])

  return { count, loading, error }
}
