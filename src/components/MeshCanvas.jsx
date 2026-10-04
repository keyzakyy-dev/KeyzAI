import { useEffect, useRef } from 'react'

const INK = '244, 244, 245'
const MAX_EDGES = 4

export function MeshCanvas({
  className = 'block h-full w-full',
  label = 'Decorative animated network mesh.',
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let nodes = []
    let raf = 0
    let last = 0
    let visible = true
    const pointer = { x: -1e4, y: -1e4, targetX: -1e4, targetY: -1e4, active: false }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.max(36, Math.min(130, Math.round(width * height / 11000)))
      nodes = Array.from({ length: count }, () => {
        const vx = (Math.random() - 0.5) * 0.22
        const vy = (Math.random() - 0.5) * 0.22
        const hub = Math.random() < 0.08
        return { x: Math.random() * width, y: Math.random() * height, vx, vy, bx: vx, by: vy, r: hub ? 2 : 0.8 + Math.random() * 0.8, hub }
      })
    }

    const local = (event) => {
      const rect = canvas.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    const draw = (now) => {
      ctx.clearRect(0, 0, width, height)
      pointer.x += (pointer.targetX - pointer.x) * 0.12
      pointer.y += (pointer.targetY - pointer.y) * 0.12

      for (const node of nodes) {
        const dx = pointer.x - node.x
        const dy = pointer.y - node.y
        const distance = Math.hypot(dx, dy)
        const influence = pointer.active && distance < 230 ? 1 - distance / 230 : 0
        if (!reduced) {
          if (influence && distance > 1) {
            node.vx -= (dx / distance) * 0.02 * influence
            node.vy -= (dy / distance) * 0.02 * influence
          }
          node.vx += (node.bx - node.vx) * 0.02
          node.vy += (node.by - node.vy) * 0.02
          node.x += node.vx
          node.y += node.vy
          if (node.x < -10) node.x = width + 10
          if (node.x > width + 10) node.x = -10
          if (node.y < -10) node.y = height + 10
          if (node.y > height + 10) node.y = -10
        }
        node.influence = influence
      }

      const paths = Array.from({ length: MAX_EDGES }, () => new Path2D())
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i]
          const b = nodes[j]
          const distance = Math.hypot(a.x - b.x, a.y - b.y)
          if (distance > 115) continue
          const strength = (1 - distance / 115) * (1 + 3 * Math.max(a.influence, b.influence))
          const bucket = Math.min(MAX_EDGES - 1, Math.floor(strength * 1.2))
          paths[bucket].moveTo(a.x, a.y)
          paths[bucket].lineTo(b.x, b.y)
        }
      }

      ctx.lineWidth = 1
      for (let i = 0; i < MAX_EDGES; i += 1) {
        ctx.strokeStyle = `rgba(${INK}, ${0.045 + i * 0.05})`
        ctx.stroke(paths[i])
      }

      for (const node of nodes) {
        const alpha = (node.hub ? 0.38 : 0.22) + node.influence * 0.55
        ctx.fillStyle = `rgba(${INK}, ${alpha})`
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r + node.influence, 0, Math.PI * 2)
        ctx.fill()
        if (node.hub) {
          ctx.strokeStyle = `rgba(${INK}, ${0.1 + node.influence * 0.3})`
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.r + 4 + node.influence * 2, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    }

    const animate = (now) => {
      if (!visible || document.hidden) return
      if (now - last >= 12) {
        last = now
        draw(now)
      }
      raf = requestAnimationFrame(animate)
    }
    const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(animate) }
    const move = (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return
      const point = local(event)
      pointer.targetX = point.x
      pointer.targetY = point.y
      if (!pointer.active) { pointer.x = point.x; pointer.y = point.y }
      pointer.active = true
      if (reduced) draw(performance.now())
    }
    const leave = () => { pointer.active = false; if (reduced) draw(performance.now()) }
    const visibility = () => { visible = !document.hidden; visible ? start() : cancelAnimationFrame(raf) }
    const observer = new ResizeObserver(() => { resize(); draw(performance.now()) })
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? start() : cancelAnimationFrame(raf) })

    resize()
    draw(performance.now())
    observer.observe(canvas)
    intersection.observe(canvas)
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    document.addEventListener('visibilitychange', visibility)
    if (!reduced) start()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      intersection.disconnect()
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} role="img" aria-label={label} />
}
