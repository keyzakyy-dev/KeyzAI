import { useEffect, useRef } from 'react'

// Connected mesh: hexagonal grid with lines between nodes + dots at vertices.
// Subtle 3D perspective (Y rotation). Mouse repels nearby nodes.
const SPACING = 72
const NODE_R = 1.8
const LINE_W = 0.6
const PERSPECTIVE = 420 // focal length for 3D
const ROT_Y = -0.18 // radians, subtle Y rotation
const DRIFT_SPEED = 0.00035
const POINTER_R = 260
const POINTER_PUSH = 18
const ALPHA_BASE = 0.18
const ALPHA_HOVER = 0.55
const BUCKETS = 8

// Konversi alpha relatif -> indeks bucket [0, BUCKETS-1].
// Nilai bisa negatif (alpha di bawah ALPHA_BASE saat node menjauh dari
// kamera) dan bisa > BUCKETS, jadi harus di-clamp dua sisi.
// Tanpa ini, indeks -1 membuat paths[-1] undefined -> TypeError.
function clampBucket(v) {
  if (!Number.isFinite(v)) return 0
  const i = Math.floor(v)
  if (i < 0) return 0
  if (i >= BUCKETS) return BUCKETS - 1
  return i
}

export function MeshCanvas({
  className = 'block h-full w-full',
  label = 'Decorative background: connected hexagonal mesh with subtle 3D perspective, bends around cursor.',
  parallax = false,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = motionQuery.matches

    const getInk = () => getComputedStyle(canvas).getPropertyValue('--foreground').trim()

    // ---- state ----
    let W = 0, H = 0, dpr = 1
    let nodes = [] // { x, y, z, baseX, baseY }
    let edges = [] // [i, j]
    const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, active: false }
    let raf = 0, running = false, visible = true, lastTime = 0, time = 0
    let scrollShift = 0, scrollTarget = 0

    const onScroll = () => { scrollTarget = -window.scrollY * 0.06 }
    if (parallax) {
      window.addEventListener('scroll', onScroll, { passive: true })
      scrollTarget = scrollShift = -window.scrollY * 0.06
    }

    // ---- LAYOUT: hexagonal grid ----
    function layout() {
      if (parallax) {
        W = window.innerWidth
        H = window.innerHeight
      } else {
        const rect = parent.getBoundingClientRect()
        W = Math.max(1, Math.round(rect.width))
        H = Math.max(1, Math.round(rect.height))
      }
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // hex grid spacing
      const h = SPACING * Math.sqrt(3) / 2 // vertical spacing
      const v = SPACING * 1.5 // horizontal row spacing

      nodes = []
      const nodeMap = new Map() // "row,col" -> index

      // generate nodes
      let row = 0
      for (let y = -h; y < H + h; y += h, row++) {
        const xOffset = (row % 2) * (SPACING / 2)
        for (let x = -SPACING + xOffset; x < W + SPACING; x += SPACING) {
          const idx = nodes.length
          const baseX = x
          const baseY = y
          // initial z variation for subtle terrain
          const z = (Math.sin(x * 0.01) * Math.cos(y * 0.01)) * 40
          nodes.push({ x, y, z, baseX, baseY, vx: 0, vy: 0, vz: 0 })
          nodeMap.set(`${row},${(x + SPACING - xOffset) / SPACING}`, idx)
        }
      }

      // generate edges (6 neighbors in hex grid)
      edges = []
      row = 0
      for (let y = -h; y < H + h; y += h, row++) {
        const xOffset = (row % 2) * (SPACING / 2)
        let col = 0
        for (let x = -SPACING + xOffset; x < W + SPACING; x += SPACING, col++) {
          const idx = nodeMap.get(`${row},${col}`)
          if (idx === undefined) continue

          // 6 neighbor directions in axial-ish coordinates
          const dirs = [
            [0, -1],   // up
            [1, -1],   // up-right
            [1, 0],    // right
            [0, 1],    // down
            [-1, 1],   // down-left
            [-1, 0],   // left
          ]
          for (const [dr, dc] of dirs) {
            const nIdx = nodeMap.get(`${row + dr},${col + dc}`)
            if (nIdx !== undefined && idx < nIdx) {
              edges.push([idx, nIdx])
            }
          }
        }
      }
    }

    // project 3D -> 2D with perspective
    function project(node) {
      const cx = W / 2
      const cy = H / 2
      const dx = node.x - cx
      const dy = node.y - cy
      // rotate Y
      const cos = Math.cos(ROT_Y)
      const sin = Math.sin(ROT_Y)
      const rx = dx * cos - node.z * sin
      const rz = dx * sin + node.z * cos
      // perspective
      const scale = PERSPECTIVE / (PERSPECTIVE + rz)
      return {
        x: cx + rx * scale,
        y: node.y * scale + cy * (1 - scale) + scrollShift,
        z: rz,
        scale,
      }
    }

    // ---- DRAW ----
    function draw() {
      ctx.clearRect(0, 0, W, H)

      const ink = getInk()
      const paths = Array.from({ length: BUCKETS }, () => new Path2D())
      const nodePaths = Array.from({ length: BUCKETS }, () => new Path2D())

      // animate nodes
      for (const n of nodes) {
        // drift
        n.x = n.baseX + Math.sin(time + n.baseX * 0.008) * 12
        n.y = n.baseY + Math.cos(time * 0.7 + n.baseY * 0.008) * 10 + scrollShift
        n.z = Math.sin(time * 0.3 + n.baseX * 0.005) * Math.cos(time * 0.2 + n.baseY * 0.005) * 35
      }

      // pointer influence
      if (pointer.active && !reduced) {
        for (const n of nodes) {
          const dx = n.x - pointer.x
          const dy = n.y - pointer.y
          const d = Math.hypot(dx, dy)
          if (d < POINTER_R && d > 0.5) {
            const e = (1 - d / POINTER_R) ** 2
            const push = POINTER_PUSH * e
            n.vx += (dx / d) * push * 0.15
            n.vy += (dy / d) * push * 0.15
          }
        }
      }

      // apply velocity with damping
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        n.vx *= 0.88
        n.vy *= 0.88
        // spring back to base
        n.vx += (n.baseX - n.x) * 0.012
        n.vy += (n.baseY - n.y) * 0.012
      }

      // project all nodes
      const projected = nodes.map(project)

      // draw edges (lines)
      for (const [i, j] of edges) {
        const a = projected[i]
        const b = projected[j]
        if (!a || !b) continue

        // alpha based on average depth (closer = brighter)
        const avgScale = (a.scale + b.scale) / 2
        let alpha = ALPHA_BASE * avgScale

        // pointer highlight on edges near cursor
        if (pointer.active && !reduced) {
          const mx = (a.x + b.x) / 2
          const my = (a.y + b.y) / 2
          const dx = mx - pointer.x
          const dy = my - pointer.y
          const d = Math.hypot(dx, dy)
          if (d < POINTER_R * 1.2) {
            const e = (1 - d / (POINTER_R * 1.2)) ** 1.5
            alpha += ALPHA_HOVER * e * avgScale
          }
        }

        // avgScale bisa < 1 (node menjauh dari kamera), jadi alpha bisa turun di
        // bawah ALPHA_BASE dan hasil perhitungan jadi negatif. Clamp dua sisi:
        // tanpa clamp bawah, bIdx = -1 dan paths[-1] undefined -> TypeError.
        const bIdx = clampBucket(((alpha - ALPHA_BASE) / (ALPHA_HOVER || 1)) * BUCKETS)
        paths[bIdx].moveTo(a.x, a.y)
        paths[bIdx].lineTo(b.x, b.y)
      }

      // draw nodes (dots)
      for (const p of projected) {
        let a = ALPHA_BASE * 1.4 * p.scale
        if (pointer.active && !reduced) {
          const dx = p.x - pointer.x
          const dy = p.y - pointer.y
          const d = Math.hypot(dx, dy)
          if (d < POINTER_R) {
            const e = (1 - d / POINTER_R) ** 2
            a += ALPHA_HOVER * e * p.scale
          }
        }
        const b = clampBucket(((alpha - ALPHA_BASE) / (ALPHA_HOVER || 1)) * BUCKETS)
        const r = NODE_R * p.scale
        nodePaths[b].moveTo(p.x + r, p.y)
        nodePaths[b].arc(p.x, p.y, r, 0, Math.PI * 2)
      }

      // stroke edges
      ctx.lineWidth = LINE_W
      ctx.lineCap = 'round'
      for (let b = 0; b < BUCKETS; b++) {
        const a = ALPHA_BASE + (ALPHA_HOVER * (b + 0.5)) / BUCKETS
        ctx.strokeStyle = `hsl(${ink} / ${a.toFixed(3)})`
        ctx.stroke(paths[b])
      }

      // fill nodes
      for (let b = 0; b < BUCKETS; b++) {
        const a = ALPHA_BASE * 1.4 + (ALPHA_HOVER * (b + 0.5)) / BUCKETS
        ctx.fillStyle = `hsl(${ink} / ${Math.min(1, a).toFixed(3)})`
        ctx.fill(nodePaths[b])
      }
    }

    // ---- LOOP ----
    function step(now) {
      raf = 0
      if (!running) return

      const dt = lastTime ? Math.min(2.5, (now - lastTime) / (1000 / 60)) : 1
      lastTime = now

      if (pointer.active) {
        pointer.x += (pointer.tx - pointer.x) * Math.min(1, 0.22 * dt)
        pointer.y += (pointer.ty - pointer.y) * Math.min(1, 0.22 * dt)
      }

      time += DRIFT_SPEED * dt * 1000
      scrollShift += (scrollTarget - scrollShift) * Math.min(1, 0.06 * dt)

      draw()
      raf = requestAnimationFrame(step)
    }

    const start = () => {
      if (running || !visible || document.hidden) return
      running = true
      lastTime = 0
      raf = requestAnimationFrame(step)
    }
    const stop = () => {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    const toLocal = (e) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const onMove = (e) => {
      const { x, y } = toLocal(e)
      if (!pointer.active) { pointer.x = x; pointer.y = y }
      pointer.tx = x
      pointer.ty = y
      pointer.active = true
      if (reduced) draw()
    }
    const onLeave = () => {
      pointer.active = false
      if (reduced) draw()
    }
    const onOut = (e) => { if (e.relatedTarget === null) onLeave() }

    const onVisibility = () => { document.hidden ? stop() : start() }

    const onMotionChange = (e) => {
      reduced = e.matches
      if (reduced) {
        scrollShift = 0
        draw()
        stop()
      } else start()
    }

    // theme change → re-draw
    const colorObserver = new MutationObserver(() => draw())
    colorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    // resize
    let resizeRaf = 0
    const resizeObserver = new ResizeObserver(() => {
      if (resizeRaf) return
      resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; layout(); draw() })
    })

    // pause when off-screen
    const intersectObserver = new IntersectionObserver(
      (entries) => { visible = entries.some((e) => e.isIntersecting); visible ? start() : stop() },
      { rootMargin: '80px' }
    )

    layout()
    draw()
    resizeObserver.observe(parent)
    intersectObserver.observe(canvas)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerout', onOut, { passive: true })
    window.addEventListener('blur', onLeave)
    document.addEventListener('visibilitychange', onVisibility)
    motionQuery.addEventListener('change', onMotionChange)
    if (!reduced) start()

    return () => {
      stop()
      if (resizeRaf) cancelAnimationFrame(resizeRaf)
      resizeObserver.disconnect()
      colorObserver.disconnect()
      intersectObserver.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onOut)
      window.removeEventListener('blur', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener('change', onMotionChange)
      if (parallax) window.removeEventListener('scroll', onScroll)
    }
  }, [parallax])

  return <canvas ref={canvasRef} className={className} role="img" aria-label={label} />
}