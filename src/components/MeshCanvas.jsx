import { useEffect, useRef } from 'react'

// Kontur topografi: baris horizontal paralel yang digeser gelombang sinus.
// AMP < ROW_SPACING / 2 adalah syarat agar antar baris tidak pernah berpotongan.
const ROW_SPACING = 78
const AMP = 26
const AMP_MAX = 32
const X_STEP = 14
const POINTER_R = 220
const POINTER_PUSH = 14

export function MeshCanvas({
  className = 'block h-full w-full',
  label = 'Decorative background: contour lines that drift and bend around your cursor.',
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

    // Resolve HSL token (format: "H S% L%")
    const getInk = () => getComputedStyle(canvas).getPropertyValue('--foreground').trim()

    // ---- state ----
    let W = 0, H = 0, dpr = 1
    let rows = []
    const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, active: false }
    let raf = 0, running = false, visible = true, lastTime = 0, time = 0
    let scrollPhase = 0, scrollTarget = 0

    // parallax: fase medan bergeser mengikuti scroll (smooth di loop)
    const onScroll = () => { scrollTarget = window.scrollY * 0.0012 }
    if (parallax) {
      window.addEventListener('scroll', onScroll, { passive: true })
      scrollTarget = window.scrollY * 0.0012
      scrollPhase = scrollTarget
    }

    // ---- LAYOUT ----
    function layout() {
      if (parallax) {
        // canvas fixed inset-0: ukuran = viewport, bukan tinggi dokumen
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

      // satu baris kontur per ROW_SPACING px, dengan alpha & fase acak supaya tidak terlihat mechanical
      rows = []
      let n = 0
      for (let y = ROW_SPACING / 2; y < H + ROW_SPACING; y += ROW_SPACING) {
        rows.push({ y, a: 0.05 + Math.random() * 0.09, phase: (n++ % 7) * 0.9 + Math.random() * 0.6 })
      }
    }

    // ---- FIELD ----
    // offset vertikal untuk satu baris pada koordinat x (tanpa pointer)
    function wave(x, rowY, t) {
      return (
        Math.sin(x * 0.008 + rowY * 0.004 + t * 0.35) * 0.6 +
        Math.sin(x * 0.0035 - rowY * 0.002 + t * 0.22) * 0.4
      )
    }

    // ---- DRAW ----
    function draw() {
      ctx.clearRect(0, 0, W, H)
      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      const ink = getInk()
      const g = time + scrollPhase

      // amplitude naik sedikit terhadap scroll → feedback kedalaman
      const amp = AMP + (AMP_MAX - AMP) * Math.min(1, Math.abs(scrollPhase) * 0.6)

      for (const row of rows) {
        ctx.strokeStyle = `hsl(${ink} / ${row.a.toFixed(3)})`
        ctx.beginPath()
        for (let x = 0; x <= W + X_STEP; x += X_STEP) {
          let y = row.y + wave(x, row.y, g + row.phase) * amp
          if (pointer.active) {
            const dx = x - pointer.x
            const dy = row.y - pointer.y
            const d = Math.hypot(dx, dy)
            if (d < POINTER_R && d > 0.5) {
              const f = 1 - d / POINTER_R
              y += (dy / d) * f * f * POINTER_PUSH
            }
          }
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
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
      scrollPhase += (scrollTarget - scrollPhase) * Math.min(1, 0.08 * dt)

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
      window.removeEventListener('scroll', onScroll)
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
