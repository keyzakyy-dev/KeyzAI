import { useEffect, useRef } from 'react'

// ponytail: sine-based pseudo noise field (bukan simplex noise asli); upgrade ke simplex jika pola terlihat berulang.
const SEED_SPACING = 46
const STEPS = 100
const STEP_LEN = 2.4

export function MeshCanvas({
  className = 'block h-full w-full',
  label = 'Decorative background: flowing streamlines that bend around your cursor.',
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
    let seeds = []
    const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, active: false }
    let raf = 0, running = false, visible = true, lastTime = 0, time = 0

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

      seeds = []
      for (let y = SEED_SPACING / 2; y < H + SEED_SPACING; y += SEED_SPACING) {
        for (let x = SEED_SPACING / 2; x < W + SEED_SPACING; x += SEED_SPACING) {
          seeds.push({ x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 20, a: 0.1 + Math.random() * 0.12 })
        }
      }
    }

    // ---- FIELD ----
    // medan kecepatan dari superposisi gelombang sinus
    function field(x, y, t, out) {
      let vx = Math.sin(y * 0.006 + t * 0.4) + 0.5 * Math.sin(y * 0.013 - t * 0.23)
      let vy = Math.cos(x * 0.006 - t * 0.32) + 0.5 * Math.cos(x * 0.011 + t * 0.19)
      if (pointer.active) {
        const dx = x - pointer.x, dy = y - pointer.y
        const d = Math.hypot(dx, dy)
        if (d < 220 && d > 0.5) {
          const f = (1 - d / 220) * 2.2
          vx += (-dy / d) * f
          vy += (dx / d) * f
        }
      }
      out[0] = vx
      out[1] = vy
    }

    // ---- DRAW ----
    const vec = [0, 0]
    function draw() {
      ctx.clearRect(0, 0, W, H)
      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      const ink = getInk()

      for (const seed of seeds) {
        ctx.strokeStyle = `hsl(${ink} / ${seed.a.toFixed(3)})`
        ctx.beginPath()
        ctx.moveTo(seed.x, seed.y)
        let x = seed.x, y = seed.y
        for (let i = 0; i < STEPS; i++) {
          field(x, y, time, vec)
          x += vec[0] * STEP_LEN
          y += vec[1] * STEP_LEN
          if (x < -20 || x > W + 20 || y < -20 || y > H + 20) break
          ctx.lineTo(x, y)
        }
        ctx.stroke()
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

      time += 0.004 * dt

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

    const onVisibility = () => { document.hidden ? stop() : start() }

    const onMotionChange = (e) => {
      reduced = e.matches
      if (reduced) stop()
      else start()
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
