import { useEffect, useRef } from 'react'

interface HexPoint {
  q: number
  r: number
  x: number
  y: number
  size: number
  depth: number // 0..1
}

interface Wave {
  x: number
  y: number
  t: number
}

interface Props {
  intensity?: number // 0..1
  className?: string
}

const HEX_SIZE_BASE = 32

// Axial -> pixel
function axialToPixel(q: number, r: number, size: number) {
  const x = size * Math.sqrt(3) * (q + r / 2)
  const y = size * 1.5 * r
  return { x, y }
}

function drawHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6
    const x = cx + size * Math.cos(angle)
    const y = cy + size * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

export function HexagonalBackground({ intensity = 1, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999, active: false })
  const wavesRef = useRef<Wave[]>([])
  const reduceMotion = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceMotion.current = mq.matches
    const onChange = () => (reduceMotion.current = mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0
    let hexes: HexPoint[] = []
    let raf = 0
    let start = performance.now()
    let prev = start

    const isDark = () => document.documentElement.classList.contains('dark')

    const setup = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      hexes = []
      const margin = 80
      // 3 layers with different sizes (depth)
      const layers: Array<{ sizeMul: number; depth: number; alpha: number }> = [
        { sizeMul: 0.7, depth: 0.25, alpha: 0.18 },
        { sizeMul: 1.0, depth: 0.6, alpha: 0.32 },
        { sizeMul: 1.35, depth: 1.0, alpha: 0.55 },
      ]
      const size = HEX_SIZE_BASE
      for (const layer of layers) {
        const ls = size * layer.sizeMul
        const w = ls * Math.sqrt(3)
        const h = ls * 1.5
        for (let y = -margin; y < height + margin; y += h) {
          const row = Math.round(y / h)
          const xOff = row % 2 === 0 ? 0 : w / 2
          for (let x = -margin; x < width + margin; x += w) {
            hexes.push({
              q: x,
              r: y,
              x: x + xOff,
              y,
              size: ls,
              depth: layer.depth,
            })
          }
        }
      }
    }

    const render = (now: number) => {
      const dt = Math.min(64, now - prev)
      prev = now
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, width, height)

      const dark = isDark()
      const mouse = mouseRef.current

      // mouse parallax offset
      const mx = mouse.active ? mouse.x : width / 2
      const my = mouse.active ? mouse.y : height / 2
      const px = (mx - width / 2) * 0.02
      const py = (my - height / 2) * 0.02

      // ambient drift
      const drift = reduceMotion.current ? 0 : 0.3

      for (const h of hexes) {
        // Drift per layer
        const driftX = Math.sin(t * 0.15 + h.q * 0.001) * drift * h.depth
        const driftY = Math.cos(t * 0.12 + h.r * 0.001) * drift * h.depth

        const dx = h.x + driftX - mx
        const dy = h.y + driftY - my
        const dist = Math.hypot(dx, dy)
        const maxR = 200 * intensity
        const proximity = Math.max(0, 1 - dist / maxR)

        // base alpha by layer
        const baseAlpha = h.depth === 0.25 ? 0.14 : h.depth === 0.6 ? 0.22 : 0.36

        // wave intensity
        let waveBoost = 0
        for (const w of wavesRef.current) {
          const wd = Math.hypot(h.x - w.x, h.y - w.y)
          const wt = (now - w.t) / 800
          if (wt < 1 && wd < 220) {
            waveBoost += (1 - wt) * (1 - wd / 220) * 0.7
          }
        }

        const alpha = Math.min(1, baseAlpha + proximity * 0.55 + waveBoost * 0.8) * intensity

        // parallax by depth
        const parX = px * h.depth * 6
        const parY = py * h.depth * 6

        // color: based on depth and proximity
        let stroke: string
        if (dark) {
          if (h.depth > 0.8) stroke = `rgba(139, 92, 246, ${alpha * 0.9})`
          else if (h.depth > 0.5) stroke = `rgba(96, 165, 250, ${alpha * 0.7})`
          else stroke = `rgba(59, 130, 246, ${alpha * 0.45})`
        } else {
          if (h.depth > 0.8) stroke = `rgba(124, 58, 237, ${alpha * 0.55})`
          else if (h.depth > 0.5) stroke = `rgba(59, 130, 246, ${alpha * 0.42})`
          else stroke = `rgba(30, 58, 138, ${alpha * 0.28})`
        }

        // glow on near
        if (proximity > 0.05) {
          ctx.shadowBlur = 12 * proximity * intensity
          if (dark) {
            ctx.shadowColor = `rgba(139, 92, 246, ${proximity * 0.9})`
          } else {
            ctx.shadowColor = `rgba(99, 102, 241, ${proximity * 0.6})`
          }
        } else {
          ctx.shadowBlur = 0
        }

        ctx.strokeStyle = stroke
        ctx.lineWidth = h.depth > 0.7 ? 1.1 : 0.7
        drawHex(ctx, h.x + parX, h.y + parY, h.size * 0.95)
        ctx.stroke()
      }

      ctx.shadowBlur = 0

      // cleanup waves
      wavesRef.current = wavesRef.current.filter((w) => now - w.t < 1000)

      if (!reduceMotion.current) {
        raf = requestAnimationFrame(render)
      }
    }

    setup()
    raf = requestAnimationFrame(render)

    const onResize = () => {
      setup()
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      let x: number, y: number
      if ('touches' in e && e.touches.length) {
        x = e.touches[0].clientX - rect.left
        y = e.touches[0].clientY - rect.top
      } else if ('clientX' in e) {
        x = (e as MouseEvent).clientX - rect.left
        y = (e as MouseEvent).clientY - rect.top
      } else {
        return
      }
      mouseRef.current = { x, y, active: true }
    }

    const onLeave = () => {
      mouseRef.current.active = false
    }

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      wavesRef.current.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        t: performance.now(),
      })
      // Limit waves
      if (wavesRef.current.length > 5) wavesRef.current.shift()
    }

    window.addEventListener('resize', onResize)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)
    canvas.addEventListener('touchmove', onMove, { passive: true })
    canvas.addEventListener('touchend', onLeave)
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
      canvas.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('touchend', onLeave)
      canvas.removeEventListener('click', onClick)
    }
  }, [intensity])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-auto fixed inset-0 -z-10 h-full w-full ${className}`}
      aria-hidden="true"
    />
  )
}
