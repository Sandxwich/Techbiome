import '@testing-library/jest-dom/vitest'
import { afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function createCanvasContext() {
  return {
    clearRect() {},
    save() {},
    restore() {},
    beginPath() {},
    arc() {},
    fill() {},
    clip() {},
    fillRect() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    stroke() {},
    setTransform() {},
    createRadialGradient() {
      return {
        addColorStop() {},
      }
    },
    globalCompositeOperation: 'source-over',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    filter: '',
    shadowColor: '',
    shadowBlur: 0,
  }
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserver)
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())

  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() {
      return 1024
    },
  })

  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return 320
    },
  })

  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      width: 1024,
      height: 320,
      top: 0,
      left: 0,
      right: 1024,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON() {
        return {}
      },
    }),
  })

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    writable: true,
    value: vi.fn(() => createCanvasContext()),
  })
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.clearAllMocks()
})
