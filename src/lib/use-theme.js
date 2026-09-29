import { useState, useEffect, useRef } from 'react'

function getInitialTheme() {
  try {
    return localStorage.getItem('keyzai-theme') || 'dark'
  } catch {
    return 'dark'
  }
}

// Titik pusat wipe = posisi tombol yang baru diklik (button becomes
// document.activeElement). Kalau toggle dipicu tanpa klik (mis. programatik),
// jatuh ke tengah layar.
function getWipeOrigin() {
  const el = document.activeElement
  if (el && el !== document.body && el.getBoundingClientRect) {
    const rect = el.getBoundingClientRect()
    if (rect.width || rect.height) {
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    }
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)
  const mounted = useRef(false)

  useEffect(() => {
    const root = document.documentElement
    const apply = () => root.classList.toggle('dark', theme === 'dark')

    // Jangan animasi saat mount: itu load pertama, bukan perpindahan tema.
    const canWipe =
      mounted.current &&
      typeof document.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (canWipe) {
      const { x, y } = getWipeOrigin()
      root.style.setProperty('--wipe-x', `${x}px`)
      root.style.setProperty('--wipe-y', `${y}px`)
      // Memanggil startViewTransition sementara transisi lain berjalan akan
      // melewati yang sebelumnya — ini perilaku yang diinginkan saat toggle
      // kontrakif, tidak menumpuk antrean.
      document.startViewTransition(apply)
    } else {
      apply()
    }

    mounted.current = true
    try {
      localStorage.setItem('keyzai-theme', theme)
    } catch {
      // private mode — theme just won't persist
    }
  }, [theme])

  return [theme, setTheme]
}
