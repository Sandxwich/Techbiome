import { useState, useEffect, useRef } from 'react'

export function useFakeSensorData() {
  const [history, setHistory] = useState([])
  const [current, setCurrent] = useState({ temp: 0, voltage: 0, rpm: 0 })
  const tick = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      tick.current += 1
      const point = {
        time: tick.current,
        temp: 20 + Math.random() * 10 + Math.sin(tick.current / 5) * 3,
        voltage: 11.5 + Math.random() * 1.5,
        rpm: 1000 + Math.random() * 200,
      }
      setCurrent(point)
      setHistory((prev) => [...prev.slice(-29), point]) // keep last 30 points
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return { current, history }
}
