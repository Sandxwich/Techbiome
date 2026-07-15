import { useState, useEffect, useRef } from 'react'

export function useFakeSensorData(refreshIntervalMs = 500) {
  const [history, setHistory] = useState([])
  const [current, setCurrent] = useState({ temp: 0, voltage: 0, rpm: 0 })
  const tick = useRef(0)
  const lastPoint = useRef({ temp: 22, voltage: 12, rpm: 10 })

  useEffect(() => {
    const interval = setInterval(() => {
      tick.current += 1
      const target = {
        time: tick.current,
        temp: 20 + Math.random() * 10 + Math.sin(tick.current / 5) * 3,
        voltage: 11.5 + Math.random() * 1.5,
        rpm: 10 + Math.random() * 20,
      }
      const smooth = 0.28
      const point = {
        time: target.time,
        temp: lastPoint.current.temp + (target.temp - lastPoint.current.temp) * smooth,
        voltage: lastPoint.current.voltage + (target.voltage - lastPoint.current.voltage) * smooth,
        rpm: lastPoint.current.rpm + (target.rpm - lastPoint.current.rpm) * smooth,
      }
      lastPoint.current = point
      setCurrent(point)
      setHistory((prev) => [...prev.slice(-69), point]) // keep last 70 points
    }, refreshIntervalMs)

    return () => clearInterval(interval)
  }, [refreshIntervalMs])

  return { current, history }
}
