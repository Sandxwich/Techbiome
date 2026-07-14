import { useEffect, useRef } from 'react'
import './SolarGlobeWidget.css'

const SIZE = 200
const RADIUS = 82
const DEG2RAD = Math.PI / 180
const TILT = -20 * DEG2RAD

const continents = [
  [[-160, 70], [-140, 60], [-125, 49], [-117, 32], [-105, 20], [-97, 16], [-90, 15], [-85, 10], [-80, 8], [-77, 25], [-75, 35], [-70, 44], [-65, 45], [-60, 50], [-65, 60], [-80, 65], [-100, 70], [-130, 72]],
  [[-80, 10], [-77, 0], [-80, -5], [-78, -15], [-70, -20], [-70, -30], [-72, -40], [-68, -50], [-65, -55], [-58, -52], [-53, -35], [-48, -25], [-40, -15], [-35, -8], [-45, 0], [-50, 5], [-60, 8], [-70, 10]],
  [[-17, 15], [-10, 5], [10, 4], [9, -5], [12, -18], [15, -27], [20, -35], [30, -30], [35, -20], [40, -10], [45, 0], [50, 10], [43, 12], [38, 15], [32, 22], [25, 30], [10, 33], [0, 35], [-6, 33], [-10, 25]],
  [[-10, 36], [-5, 43], [0, 50], [5, 58], [15, 60], [25, 60], [30, 55], [35, 45], [28, 42], [20, 40], [15, 38], [10, 40], [0, 40], [-5, 37]],
  [[30, 55], [40, 60], [60, 70], [90, 75], [120, 73], [140, 60], [140, 45], [130, 35], [120, 25], [105, 10], [95, 5], [80, 10], [70, 20], [60, 25], [55, 35], [45, 40], [35, 45]],
  [[113, -22], [120, -20], [135, -12], [142, -11], [150, -22], [153, -28], [150, -38], [140, -38], [130, -32], [120, -34]],
  [[-45, 60], [-35, 65], [-25, 72], [-30, 78], [-45, 80], [-55, 70], [-50, 63]],
]

const nodes = [
  [-122.4, 37.7],
  [-0.1, 51.5],
  [139.7, 35.7],
  [-46.6, -23.5],
  [36.8, -1.3],
  [151.2, -33.9],
  [-21.9, 64.1],
]

function project(lon, lat, rot) {
  const cx = SIZE / 2
  const cy = SIZE / 2
  const phi = lat * DEG2RAD
  const lambda = lon * DEG2RAD - rot
  const cosPhi = Math.cos(phi)
  const sinPhi = Math.sin(phi)
  const cosL = Math.cos(lambda)
  const sinL = Math.sin(lambda)
  const x = RADIUS * cosPhi * sinL
  const y = RADIUS * (sinPhi * Math.cos(TILT) - cosPhi * cosL * Math.sin(TILT))
  const z = sinPhi * Math.sin(TILT) + cosPhi * cosL * Math.cos(TILT)
  return { x: cx + x, y: cy - y, z }
}

function buildVisibleSegments(poly, rot, zCutoff = -0.02) {
  const points = poly.map(([lon, lat]) => ({
    lon,
    lat,
    p: project(lon, lat, rot),
  }))

  const segments = []
  let current = []

  const projectEdgeCrossing = (a, b) => {
    const denom = b.p.z - a.p.z
    const t = denom === 0 ? 0 : (zCutoff - a.p.z) / denom
    const clamped = Math.max(0, Math.min(1, t))
    const lon = a.lon + (b.lon - a.lon) * clamped
    const lat = a.lat + (b.lat - a.lat) * clamped
    return project(lon, lat, rot)
  }

  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const aVisible = a.p.z > zCutoff
    const bVisible = b.p.z > zCutoff

    if (aVisible && bVisible) {
      if (current.length === 0) {
        current.push(a.p)
      }
      current.push(b.p)
    } else if (aVisible && !bVisible) {
      current.push(projectEdgeCrossing(a, b))
      if (current.length >= 3) {
        segments.push(current)
      }
      current = []
    } else if (!aVisible && bVisible) {
      current = [projectEdgeCrossing(a, b), b.p]
    }
  }

  if (current.length >= 3) {
    segments.push(current)
  }

  return segments
}

export default function SolarGlobeWidget({
  size = 96,
  count,
  loading = false,
  error = null,
  label = 'devices on the grid',
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return undefined
    }

    const applyScale = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = SIZE * dpr
      canvas.height = SIZE * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    applyScale()

    const reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const cx = SIZE / 2
    const cy = SIZE / 2

    const draw = (rot, t) => {
      ctx.clearRect(0, 0, SIZE, SIZE)

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, RADIUS + 7, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(159,230,201,0.18)'
      ctx.filter = 'blur(4px)'
      ctx.fill()
      ctx.restore()

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2)
      ctx.clip()

      const oceanGrad = ctx.createRadialGradient(
        cx - RADIUS * 0.4,
        cy - RADIUS * 0.4,
        RADIUS * 0.1,
        cx,
        cy,
        RADIUS * 1.15,
      )
      oceanGrad.addColorStop(0, '#2f6e57')
      oceanGrad.addColorStop(0.55, '#1c4a3a')
      oceanGrad.addColorStop(1, '#0e2a20')
      ctx.fillStyle = oceanGrad
      ctx.fillRect(cx - RADIUS, cy - RADIUS, RADIUS * 2, RADIUS * 2)

      ctx.fillStyle = '#6fa159'
      continents.forEach((poly) => {
        const visibleSegments = buildVisibleSegments(poly, rot)
        visibleSegments.forEach((segment) => {
          ctx.beginPath()
          ctx.moveTo(segment[0].x, segment[0].y)
          for (let i = 1; i < segment.length; i += 1) {
            ctx.lineTo(segment[i].x, segment[i].y)
          }
          ctx.closePath()
          ctx.fill()
        })
      })

      const shadeGrad = ctx.createRadialGradient(
        cx - RADIUS * 0.45,
        cy - RADIUS * 0.45,
        2,
        cx,
        cy,
        RADIUS * 1.05,
      )
      shadeGrad.addColorStop(0, 'rgba(255,255,255,0.30)')
      shadeGrad.addColorStop(0.5, 'rgba(255,255,255,0.03)')
      shadeGrad.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = shadeGrad
      ctx.fillRect(cx - RADIUS, cy - RADIUS, RADIUS * 2, RADIUS * 2)
      ctx.globalCompositeOperation = 'source-over'

      ctx.restore()

      ctx.beginPath()
      ctx.arc(cx, cy, RADIUS - 0.5, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(159,230,201,0.25)'
      ctx.lineWidth = 1
      ctx.stroke()

      nodes.forEach((n, i) => {
        const p = project(n[0], n[1], rot)
        if (p.z > 0.05) {
          const scale = 0.5 + p.z * 0.6
          const pulse = 0.6 + 0.4 * Math.sin(t / 500 + i * 1.3)
          ctx.beginPath()
          ctx.arc(p.x, p.y, 2.6 * scale, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(227,172,77,${0.75 * p.z * pulse + 0.2})`
          ctx.shadowColor = 'rgba(227,172,77,0.9)'
          ctx.shadowBlur = 6 * scale
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })
    }

    let rot = 0
    let frameId = null

    if (reduceMotion) {
      draw(0.6, 0)
    } else {
      const frame = (t) => {
        rot += 0.0035
        draw(rot, t)
        frameId = requestAnimationFrame(frame)
      }
      frameId = requestAnimationFrame(frame)
    }

    const handleResize = () => {
      applyScale()
      draw(rot, 0)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const displayCount = loading
    ? '...'
    : Number.isFinite(Number(count))
      ? Number(count).toLocaleString()
      : '--'

  return (
    <div
      className="solarpunk-widget-wrap"
      style={{ '--widget-size': `${size}px` }}
      aria-label="Solar grid activity widget"
    >
      <div className="solarpunk-scene" aria-hidden="true">
        <canvas ref={canvasRef} id="globe" width={SIZE} height={SIZE} className="solarpunk-globe" />
        <div className="solarpunk-ground-glow" />
      </div>
      <div className="solarpunk-tally">
        <span className="solarpunk-count">{displayCount}</span>
        <span className="solarpunk-label">{error ? 'data unavailable' : label}</span>
      </div>
    </div>
  )
}
