import { useState, useEffect, useRef } from 'react'
import { playThemeWipe } from './theme-wipe'

function getInitialTheme() {
  try {
    return localStorage.getItem('keyzai-theme') || 'dark'
  } catch {
    return 'dark'
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)
  const mounted = useRef(false)

  useEffect(() => {
    const root = document.documentElement
    const swap = () => root.classList.toggle('dark', theme === 'dark')

    // Mount pertama bukan perpindahan tema — jangan animasi, langsung
    // terapkan supaya tidak ada kilatan tema lama.
    if (mounted.current) {
      playThemeWipe(theme, swap)
    } else {
      swap()
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
