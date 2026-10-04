import { useEffect, useRef } from 'react'

// Grid segitiga sama sisi, full-page + parallax scroll, ditekuk menjauhi
// kursor dan memencar saat diklik. SIZE = panjang sisi segitiga.
const SIZE = 80
const H_SPACING = SIZE * Math.sqrt(3) / 2 // tinggi segitiga
const V_SPACING = SIZE / 2 // offset vertikal antar baris
const SCROLL_RATE = 0.08
const DRIFT_AMP = 4
const POINTER_R = 240
const POINTER_PUSH = 10
const ALPHA_BASE = 0.055
const ALPHA_HOVER = 0.32
const BUCKETS = 6

// Riak saat klik: cincin yang melebar dari titik klik, segitiga dalam band
// terdorong ke luar. Amplitudo meredup seiring waktu.
const PULSE_SPEED = 620
const PULSE_LIFE = 1.6
const PULSE_BAND = 90
const PULSE_PUSH = 16

export function MeshCanvas({
  className = 'block h-full w-full',
  label = 'Decorative background: triangle mesh that drifts with scroll, bends around your cursor, and ripples when you click.',
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
    let cells = []
    const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, active: false }
    const pulses = []
    let raf = 0, running = false, visible = true, lastTime = 0, time = 0
    let scrollShift = 0, scrollTarget = 0

    const onScroll = () => { scrollTarget = -window.scrollY * SCROLL_RATE }
    if (parallax) {
      window.addEventListener('scroll', onScroll, { passive: true })
      scrollTarget = scrollShift = -window.scrollY * SCROLL_RATE
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

      cells = []
      let row = 0
      for (let y = -H_SPACING; y < H + H_SPACING; y += H_SPACING, row++) {
        const xStart = -SIZE
        const xEnd = W + SIZE
        for (let x = xStart; x <= xEnd; x += SIZE) {
          // Segitiga pointing up
          cells.push({ x, y, up: true })
          // Segitiga pointing down (offset setengah SIZE ke kanan)
          cells.push({ x: x + SIZE / 2, y: y + H_SPACING, up: false })
        }
      }
    }

    // ---- DRAW ----
    function triangle(p, cx, cy, size, up) {
      const h = size * Math.sqrt(3) / 2
      if (up) {
        p.moveTo(cx, cy - h * 2/3)
        p.lineTo(cx - size / 2, cy + h / 3)
        p.lineTo(cx + size / 2, cy + h / 3)
      } else {
        p.moveTo(cx, cy + h * 2/3)
        p.lineTo(cx - size / 2, cy - h / 3)
        p.lineTo(cx + size / 2, cy - h / 3)
      }
      p.closePath()
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      ctx.lineWidth = 1
      const ink = getInk()
      const shiftY = reduced ? 0 : scrollShift + Math.sin(time) * DRIFT_AMP
      const shiftX = reduced ? 0 : Math.cos(time * 0.7) * DRIFT_AMP

      // Bucket per level alpha → 6 stroke call, bukan ratusan.
      const paths = Array.from({ length: BUCKETS }, () => new Path2D())

      // Riak klik: untuk setiap pulse yang masih hidup, pre-compute radius
      // cincin + amplitudo yang meredup. Tanpa ini tiap sel akan menghitung
      // hypot ke tiap pulse (N sel × M pulse per frame).
      const now = performance.now()
      const live = []
      for (let n = pulses.length - 1; n >= 0; n--) {
        const age = (now - pulses[n].t) / 1000
        if (age > PULSE_LIFE) { pulses.splice(n, 1); continue }
        live.push({ ...pulses[n], wave: age * PULSE_SPEED, amp: (1 - age / PULSE_LIFE) * PULSE_PUSH })
      }

      for (const c of cells) {
        const cx = c.x + shiftX
        const cy = c.y + shiftY
        let a = ALPHA_BASE
        let scale = 1
        let ox = 0
        let oy = 0
        if (pointer.active && !reduced) {
          const dx = cx - pointer.x
          const dy = cy - pointer.y
          const d = Math.hypot(dx, dy)
          if (d < POINTER_R && d > 0.5) {
            const e = (1 - d / POINTER_R) ** 2
            a += ALPHA_HOVER * e
            scale = 1 + 0.08 * e
            ox = (dx / d) * POINTER_PUSH * e
            oy = (dy / d) * POINTER_PUSH * e
          }
        }
        for (const p of live) {
          const dx = cx - p.x
          const dy = cy - p.y
          const d = Math.hypot(dx, dy)
          const band = Math.abs(d - p.wave)
          if (band < PULSE_BAND && d > 0.5) {
            const e = 1 - band / PULSE_BAND
            a += ALPHA_HOVER * 0.7 * e
            scale = Math.max(scale, 1 + 0.05 * e)
            const s = e * e * p.amp
            ox += (dx / d) * s
            oy += (dy / d) * s
          }
        }
        const b = Math.min(BUCKETS - 1, Math.floor(((a - ALPHA_BASE) / ALPHA_HOVER) * BUCKETS))
        triangle(paths[b], cx + ox, cy + oy, SIZE * scale, c.up)
      }

      for (let b = 0; b < BUCKETS; b++) {
        const a = ALPHA_BASE + (ALPHA_HOVER * (b + 0.5)) / BUCKETS
        ctx.strokeStyle = `hsl(${ink} / ${a.toFixed(3)})`
        ctx.stroke(paths[b])
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

      time += 0.006 * dt
      scrollShift += (scrollTarget - scrollShift) * Math.min(1, 0.08 * dt)

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
    const onDown = (e) => {
      if (reduced) return
      const { x, y } = toLocal(e)
      // Abaikan klik yang jatuh di luar kanvas (mis. di elemen sticky).
      if (x < 0 || y < 0 || x > W || y > H) return
      pulses.push({ x, y, t: performance.now() })
      if (pulses.length > 6) pulses.shift()
    }

    const onVisibility = () => { document.hidden ? stop() : start() }

    const onMotionChange = (e) => {
      reduced = e.matches
      if (reduced) {
        scrollShift = 0
        draw()
        stop()
      }
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
      if (parallax) window.removeEventListener('scroll', onScroll)
    }
  }, [parallax])

  return <canvas ref={canvasRef} className={className} role="img" aria-label={label} />
}
