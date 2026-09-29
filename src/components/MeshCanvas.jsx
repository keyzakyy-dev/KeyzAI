import { useEffect, useRef } from 'react'

export function MeshCanvas({
  className = 'block h-full w-full',
  label = 'Decorative background: a mesh of points that bends around your cursor.',
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

    // Resolve HSL token (format: "H S% L%")
    const getInk = () => getComputedStyle(canvas).getPropertyValue('--foreground').trim()

    // ---- state ----
    let W = 0, H = 0, dpr = 1
    let spacing = 48, cols = 0, rows = 0, nodeCount = 0
    let restX = new Float32Array(0), restY = new Float32Array(0)
    let curX = new Float32Array(0), curY = new Float32Array(0)
    let velX = new Float32Array(0), velY = new Float32Array(0)
    let phase = new Float32Array(0)
    let edges = new Int32Array(0), edgeCount = 0
    const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, active: false }
    const pulses = []
    let raf = 0, running = false, visible = true, lastTime = 0
    const paths = Array.from({ length: 9 }, () => new Path2D())

    // ---- LAYOUT ----
    function layout() {
      const rect = parent.getBoundingClientRect()
      W = Math.max(1, Math.round(rect.width))
      H = Math.max(1, Math.round(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const rowHeight = 0.8660254 * (spacing = Math.max(34, Math.min(58, W / 27)))
      cols = Math.ceil(W / spacing) + 3
      rows = Math.ceil(H / rowHeight) + 3
      nodeCount = cols * rows

      restX = new Float32Array(nodeCount)
      restY = new Float32Array(nodeCount)
      curX = new Float32Array(nodeCount)
      curY = new Float32Array(nodeCount)
      velX = new Float32Array(nodeCount)
      velY = new Float32Array(nodeCount)
      phase = new Float32Array(nodeCount)

      for (let r = 0; r < rows; r++) {
        const offset = r % 2 === 0 ? 0 : spacing / 2
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          restX[i] = c * spacing + offset - spacing
          restY[i] = r * rowHeight - rowHeight
          curX[i] = restX[i]
          curY[i] = restY[i]
          phase[i] = Math.random() * Math.PI * 2
        }
      }

      // Build edge list: horizontal + 2 diagonal per node (hex lattice)
      const list = []
      for (let r = 0; r < rows; r++) {
        const even = r % 2 === 0
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          if (c + 1 < cols) list.push(i, i + 1)
          if (r + 1 < rows) {
            const down = (r + 1) * cols + c
            list.push(i, down)
            if (even) { if (c - 1 >= 0) list.push(i, down - 1); }
            else      { if (c + 1 < cols) list.push(i, down + 1); }
          }
        }
      }
      edges = Int32Array.from(list)
      edgeCount = edges.length / 2
    }

    // ---- DRAW ----
    function draw() {
      ctx.clearRect(0, 0, W, H)
      const reach = 5 * spacing
      const { x: px, y: py, active } = pointer

      for (let b = 0; b < 9; b++) paths[b] = new Path2D()

      for (let e = 0; e < edgeCount; e++) {
        const a = edges[2 * e], o = edges[2 * e + 1]
        const x1 = curX[a], y1 = curY[a], x2 = curX[o], y2 = curY[o]

        const stretch = Math.abs(Math.hypot(x2 - x1, y2 - y1) - spacing) / spacing
        let alpha = 0.085 + Math.min(0.55, stretch * 2.2)

        if (active) {
          const d = Math.hypot((x1 + x2) * 0.5 - px, (y1 + y2) * 0.5 - py)
          if (d < reach) {
            const t = 1 - d / reach
            alpha += t * t * 0.5
          }
        }

        const b = Math.min(8, Math.floor(9 * alpha))
        paths[b].moveTo(x1, y1)
        paths[b].lineTo(x2, y2)
      }

      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      const ink = getInk()
      for (let b = 0; b < 9; b++) {
        const a = Math.min(0.92, (b + 0.5) / 9)
        ctx.strokeStyle = `hsl(${ink} / ${a.toFixed(3)})`
        ctx.stroke(paths[b])
      }

      // nodes
      ctx.fillStyle = `hsl(${ink} / 0.42)`
      for (let i = 0; i < nodeCount; i++) {
        ctx.fillRect(curX[i] - 1, curY[i] - 1, 2, 2)
      }

      // highlighted nodes near cursor
      if (active) {
        ctx.fillStyle = `hsl(${ink} / 0.95)`
        for (let i = 0; i < nodeCount; i++) {
          const d = Math.hypot(curX[i] - px, curY[i] - py)
          if (d < reach) {
            const t = 1 - d / reach
            const s = 2 + t * t * 4
            ctx.fillRect(curX[i] - s / 2, curY[i] - s / 2, s, s)
          }
        }
      }
    }

    // ---- LOOP ----
    function step(now) {
      raf = 0
      if (!running) return

      const dt = lastTime ? Math.min(2.5, (now - lastTime) / (1000 / 60)) : 1
      lastTime = now

      const reach = 5 * spacing
      const pull = 1.35 * spacing
      const spring = 0.085 * dt
      const damp = Math.pow(0.8, dt)
      const drift = 1.6 * (reduced ? 0 : 1)

      if (pointer.active) {
        pointer.x += (pointer.tx - pointer.x) * Math.min(1, 0.22 * dt)
        pointer.y += (pointer.ty - pointer.y) * Math.min(1, 0.22 * dt)
      }
      const { x: px, y: py } = pointer

      for (let i = 0; i < nodeCount; i++) {
        let x = restX[i], y = restY[i]

        // ambient drift
        if (drift) {
          const p = phase[i]
          x += Math.sin(6e-4 * now + p) * drift
          y += Math.cos(5e-4 * now + 1.3 * p) * drift
        }

        // pointer repulsion
        if (pointer.active) {
          const dx = x - px, dy = y - py
          const d = Math.hypot(dx, dy)
          if (d < reach && d > 0.001) {
            const t = 1 - d / reach
            const s = t * t * pull
            x += (dx / d) * s
            y += (dy / d) * s
          }
        }

        velX[i] += (x - curX[i]) * spring
        velY[i] += (y - curY[i]) * spring
        velX[i] *= damp
        velY[i] *= damp
        curX[i] += velX[i] * dt
        curY[i] += velY[i] * dt
      }

      // click pulses
      for (let n = pulses.length - 1; n >= 0; n--) {
        const pulse = pulses[n]
        const age = (now - pulse.t) / 1000
        if (age > 1.6) { pulses.splice(n, 1); continue }
        const wave = 620 * age
        const amp = (1 - age / 1.6) * spacing * 0.32 * dt
        for (let i = 0; i < nodeCount; i++) {
          const dx = restX[i] - pulse.x, dy = restY[i] - pulse.y
          const d = Math.hypot(dx, dy)
          const band = Math.abs(d - wave)
          if (band < 70 && d > 0.001) {
            const t = 1 - band / 70
            velX[i] += (dx / d) * t * amp
            velY[i] += (dy / d) * t * amp
          }
        }
      }

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
      const rect = parent.getBoundingClientRect()
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
    const onUpTouch = (e) => { if (e.pointerType === 'touch') onLeave() }
    const onDown = (e) => {
      if (reduced) return
      const { x, y } = toLocal(e)
      if (x < 0 || y < 0 || x > W || y > H) return
      pulses.push({ x, y, t: performance.now() })
      if (pulses.length > 6) pulses.shift()
    }
    const onVisibility = () => { document.hidden ? stop() : start() }

    const onMotionChange = (e) => {
      reduced = e.matches
      if (reduced) {
        stop()
        for (let i = 0; i < nodeCount; i++) {
          curX[i] = restX[i]; curY[i] = restY[i]; velX[i] = 0; velY[i] = 0
        }
        draw()
      } else start()
    }

    // theme change → re-draw (ink token may change)
    const colorObserver = new MutationObserver(() => draw())
    colorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    // resize (debounce via rAF)
    let resizeRaf = 0
    const resizeObserver = new ResizeObserver(() => {
      if (resizeRaf) return
      resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; layout(); draw() })
    })

    // pause saat off-screen
    const intersectObserver = new IntersectionObserver(
      (entries) => { visible = entries.some((e) => e.isIntersecting); visible ? start() : stop() },
      { rootMargin: '80px' }
    )

    layout()
    draw()
    resizeObserver.observe(parent)
    intersectObserver.observe(canvas)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUpTouch, { passive: true })
    window.addEventListener('pointercancel', onUpTouch, { passive: true })
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
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUpTouch)
      window.removeEventListener('pointercancel', onUpTouch)
      window.removeEventListener('pointerout', onOut)
      window.removeEventListener('blur', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener('change', onMotionChange)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} role="img" aria-label={label} />
}