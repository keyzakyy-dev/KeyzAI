import { useEffect, useRef } from 'react'

// Sarang lebah heksagon (pointy-top), full-page + parallax scroll, sedikit
// ditekuk menjauhi kursor. R = jari-jari heksagon — 68px → ~118px antar pusat,
// sengaja renggang supaya tidak ramai. Margin 2 baris di semua sisi agar
// geseran parallax/pointer tidak pernah meninggalkan lubang di tepi layar.
const R = 68
const COL = Math.sqrt(3) * R // jarak horizontal antar pusat
const ROW = 1.5 * R // jarak vertikal antar pusat baris
const SCROLL_RATE = 0.08 // px grid bergeser per px scroll → kesan kedalaman
const DRIFT_AMP = 4 // ayunan idle, px
const POINTER_R = 240
const POINTER_PUSH = 10
const ALPHA_BASE = 0.055
const ALPHA_HOVER = 0.32
const BUCKETS = 6

// Titik sudut heksagon relatif ke pusat — trig dihitung sekali di module scope.
const VX = Array.from({ length: 6 }, (_, k) => Math.cos((Math.PI / 180) * (60 * k - 90)))
const VY = Array.from({ length: 6 }, (_, k) => Math.sin((Math.PI / 180) * (60 * k - 90)))

export function MeshCanvas({
  className = 'block h-full w-full',
  label = 'Decorative background: full-page honeycomb that drifts with scroll and bends around your cursor.',
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
      let row = -2
      for (let y = -2 * ROW; y < H + 2 * ROW; y += ROW, row++) {
        const offset = row % 2 ? COL / 2 : 0
        for (let x = -COL; x < W + 2 * COL; x += COL) {
          cells.push({ x: x + offset, y })
        }
      }
    }

    // ---- DRAW ----
    function hex(p, cx, cy, r) {
      p.moveTo(cx + r * VX[0], cy + r * VY[0])
      for (let k = 1; k < 6; k++) p.lineTo(cx + r * VX[k], cy + r * VY[k])
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
      for (const c of cells) {
        const cx = c.x + shiftX
        const cy = c.y + shiftY
        let a = ALPHA_BASE
        let r = R
        let ox = 0
        let oy = 0
        if (pointer.active && !reduced) {
          const dx = cx - pointer.x
          const dy = cy - pointer.y
          const d = Math.hypot(dx, dy)
          if (d < POINTER_R && d > 0.5) {
            const e = (1 - d / POINTER_R) ** 2
            a += ALPHA_HOVER * e
            r = R * (1 + 0.08 * e)
            ox = (dx / d) * POINTER_PUSH * e
            oy = (dy / d) * POINTER_PUSH * e
          }
        }
        const b = Math.min(BUCKETS - 1, Math.floor(((a - ALPHA_BASE) / ALPHA_HOVER) * BUCKETS))
        hex(paths[b], cx + ox, cy + oy, r)
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
      if (parallax) window.removeEventListener('scroll', onScroll)
    }
  }, [parallax])

  return <canvas ref={canvasRef} className={className} role="img" aria-label={label} />
}
