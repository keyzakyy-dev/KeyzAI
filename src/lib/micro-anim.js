// Micro-animasi berbasis anime.js — chunk dimuat on-demand saat efek berjalan,
// jadi chunk utama tetap ringan. Semua animasi menghormati reduced-motion.
import { useEffect, useState } from 'react'

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Ikon (SVG path) "digambar" berulang: properti draw 0 0 → 0 1 bolak-balik.
export function useStrokeDraw(ref, { duration = 1100, loopDelay = 900, run = true } = {}) {
  useEffect(() => {
    if (!run || reducedMotion()) return
    let alive = true
    let anim
    import('animejs').then(({ animate, svg }) => {
      const path = ref.current?.querySelector('path')
      if (!alive || !path) return
      const [drawable] = svg.createDrawable(path)
      anim = animate(drawable, {
        draw: ['0 0', '0 1'],
        duration,
        ease: 'inOutQuad',
        alternate: true,
        loop: true,
        loopDelay,
      })
    })
    return () => {
      alive = false
      anim?.pause?.()
    }
  }, [ref, duration, loopDelay, run])
}

// Angka naik dari 0 ke value (mis. token terpakai).
export function useCountUp(value, { duration = 900 } = {}) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (reducedMotion()) {
      setV(value)
      return
    }
    let alive = true
    let anim
    import('animejs').then(({ animate, utils }) => {
      if (!alive) return
      const o = { v: 0 }
      anim = animate(o, {
        v: value,
        duration,
        ease: 'outExpo',
        modifier: utils.round(0),
        onUpdate: () => alive && setV(o.v),
      })
    })
    return () => {
      alive = false
      anim?.pause()
    }
  }, [value, duration])
  return v
}

// Bubble/chat pop-in spring (scale + naik sedikit + fade).
export function usePopIn(ref, trigger) {
  useEffect(() => {
    if (!trigger || reducedMotion()) return
    let alive = true
    import('animejs').then(({ animate }) => {
      const el = ref.current
      if (!alive || !el) return
      animate(el, {
        scale: [0.96, 1],
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 420,
        ease: 'outBack(1.6)',
      })
    })
    return () => {
      alive = false
    }
  }, [trigger])
}
