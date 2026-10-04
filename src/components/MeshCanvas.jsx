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
    const parent = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    if (!canvas || !parent || !ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let nodes = []
    let raf = 0
    let last = 0
    let visible = true
    let nextPacket = 0
    const packets = []
    const pointer = { x: -1e4, y: -1e4, targetX: -1e4, targetY: -1e4, active: false }

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
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
      if (!reduced && now > nextPacket && nodes.length) {
        const from = nodes[Math.floor(Math.random() * nodes.length)]
        const target = nodes
          .filter((node) => node !== from)
          .filter((node) => {
            const distance = Math.hypot(node.x - from.x, node.y - from.y)
            return distance > 45 && distance < 190
          })[Math.floor(Math.random() * 3)]
        if (target) packets.push({ from, target, start: now })
        nextPacket = now + 650
      }
      for (let i = packets.length - 1; i >= 0; i -= 1) {
        const packet = packets[i]
        const progress = (now - packet.start) / 950
        if (progress >= 1) { packets.splice(i, 1); continue }
        const ease = progress < 0.5 ? 2 * progress ** 2 : 1 - (-2 * progress + 2) ** 2 / 2
        const x = packet.from.x + (packet.target.x - packet.from.x) * ease
        const y = packet.from.y + (packet.target.y - packet.from.y) * ease
        const alpha = Math.sin(Math.PI * progress)
        ctx.strokeStyle = `rgba(${INK}, ${0.16 * alpha})`
        ctx.beginPath()
        ctx.moveTo(packet.from.x, packet.from.y)
        ctx.lineTo(packet.target.x, packet.target.y)
        ctx.stroke()
        ctx.fillStyle = `rgba(${INK}, ${0.85 * alpha})`
        ctx.beginPath()
        ctx.arc(x, y, 1.7, 0, Math.PI * 2)
        ctx.fill()
      }
      pointer.x += (pointer.targetX - pointer.x) * 0.12
      pointer.y += (pointer.targetY - pointer.y) * 0.12

      for (const node of nodes) {
        const dx = pointer.x - node.x
        const dy = pointer.y - node.y
        const distance = Math.hypot(dx, dy)
        const influence = pointer.active && distance < 230 ? 1 - distance / 230 : 0
        if (!reduced) {
          if (influence && distance > 1) {
            const force = distance > 70 ? 0.006 : -0.02
            node.vx += (dx / distance) * force * influence
            node.vy += (dy / distance) * force * influence
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

      if (pointer.active) {
        const nearby = nodes
          .map((node) => ({ node, distance: Math.hypot(node.x - pointer.x, node.y - pointer.y) }))
          .filter(({ distance }) => distance > 20 && distance < 260)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5)

        for (const { node, distance } of nearby) {
          const alpha = Math.max(0, (1 - distance / 260) * 0.2)
          ctx.strokeStyle = `rgba(${INK}, ${alpha})`
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(pointer.x, pointer.y)
          ctx.stroke()
        }
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
    observer.observe(parent)
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
