import { useEffect, useRef } from 'react'

// ponytail: O(n²) neighbor check, aman sampai ~110 partikel; pakai spatial grid jika count > 300.
const MAX_PARTICLES = 110
const LINK_DIST = 120

export function MeshCanvas({
  className = 'block h-full w-full',
  label = 'Decorative background: a constellation of drifting points that react to your cursor.',
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
    let count = 0
    let curX = new Float32Array(0), curY = new Float32Array(0)
    let velX = new Float32Array(0), velY = new Float32Array(0)
    let restX = new Float32Array(0), restY = new Float32Array(0)
    const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, active: false }
    const pulses = []
    let raf = 0, running = false, visible = true, lastTime = 0
    const paths = Array.from({ length: 6 }, () => new Path2D())

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

      count = Math.max(30, Math.min(MAX_PARTICLES, Math.round((W * H) / 16000)))
      curX = new Float32Array(count)
      curY = new Float32Array(count)
      velX = new Float32Array(count)
      velY = new Float32Array(count)
      restX = new Float32Array(count)
      restY = new Float32Array(count)

      for (let i = 0; i < count; i++) {
        restX[i] = Math.random() * W
        restY[i] = Math.random() * H
        curX[i] = restX[i]
        curY[i] = restY[i]
        // kecepatan drift awal kecil, arah acak
        const a = Math.random() * Math.PI * 2
        const s = 0.15 + Math.random() * 0.2
        velX[i] = Math.cos(a) * s
        velY[i] = Math.sin(a) * s
      }
    }

    // ---- DRAW ----
    function draw() {
      ctx.clearRect(0, 0, W, H)
      const reach = 160
      const { x: px, y: py, active } = pointer

      for (let b = 0; b < 6; b++) paths[b] = new Path2D()

      // garis antar partikel yang berdekatan
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = curX[i] - curX[j], dy = curY[i] - curY[j]
          const d2 = dx * dx + dy * dy
          if (d2 > LINK_DIST * LINK_DIST) continue
          const d = Math.sqrt(d2)
          let alpha = 0.38 * (1 - d / LINK_DIST)

          if (active) {
            const md = Math.hypot((curX[i] + curX[j]) * 0.5 - px, (curY[i] + curY[j]) * 0.5 - py)
            if (md < reach) {
              const t = 1 - md / reach
              alpha += t * t * 0.5
            }
          }

          const b = Math.min(5, Math.floor(6 * alpha))
          paths[b].moveTo(curX[i], curY[i])
          paths[b].lineTo(curX[j], curY[j])
        }
      }

      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      const ink = getInk()
      for (let b = 0; b < 6; b++) {
        const a = Math.min(0.9, (b + 0.5) / 6)
        ctx.strokeStyle = `hsl(${ink} / ${a.toFixed(3)})`
        ctx.stroke(paths[b])
      }

      // nodes
      for (let i = 0; i < count; i++) {
        let alpha = 0.42
        let s = 2
        if (active) {
          const d = Math.hypot(curX[i] - px, curY[i] - py)
          if (d < reach) {
            const t = 1 - d / reach
            alpha = 0.42 + t * t * 0.53
            s = 2 + t * t * 3
          }
        }
        ctx.fillStyle = `hsl(${ink} / ${alpha.toFixed(3)})`
        ctx.fillRect(curX[i] - s / 2, curY[i] - s / 2, s, s)
      }
    }

    // ---- LOOP ----
    function step(now) {
      raf = 0
      if (!running) return

      const dt = lastTime ? Math.min(2.5, (now - lastTime) / (1000 / 60)) : 1
      lastTime = now

      const reach = 160
      const pull = 60
      const spring = 0.02 * dt
      const damp = Math.pow(0.96, dt)

      if (pointer.active) {
        pointer.x += (pointer.tx - pointer.x) * Math.min(1, 0.22 * dt)
        pointer.y += (pointer.ty - pointer.y) * Math.min(1, 0.22 * dt)
      }
      const { x: px, y: py } = pointer

      for (let i = 0; i < count; i++) {
        // target = rest + repulsion dari kursor
        let tx = restX[i], ty = restY[i]
        if (pointer.active) {
          const dx = tx - px, dy = ty - py
          const d = Math.hypot(dx, dy)
          if (d < reach && d > 0.001) {
            const t = 1 - d / reach
            const s = t * t * pull
            tx += (dx / d) * s
            ty += (dy / d) * s
          }
        }

        // drift: rest bergerak pelan, bounce di tepi
        if (!reduced) {
          restX[i] += velX[i] * dt
          restY[i] += velY[i] * dt
          if (restX[i] < 0 || restX[i] > W) velX[i] *= -1
          if (restY[i] < 0 || restY[i] > H) velY[i] *= -1
          restX[i] = Math.max(0, Math.min(W, restX[i]))
          restY[i] = Math.max(0, Math.min(H, restY[i]))
        }

        velX[i] += (tx - curX[i]) * spring
        velY[i] += (ty - curY[i]) * spring
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
        const amp = (1 - age / 1.6) * 34 * dt
        for (let i = 0; i < count; i++) {
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
        for (let i = 0; i < count; i++) {
          curX[i] = restX[i]; curY[i] = restY[i]
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
