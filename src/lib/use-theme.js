import { useState, useEffect, useRef } from 'react'

function getInitialTheme() {
  try {
    return localStorage.getItem('keyzai-theme') || 'dark'
  } catch {
    return 'dark'
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)
  const timer = useRef(null)

  useEffect(() => {
    const root = document.documentElement
    // Kelas ini hanya hidup selama transisi, agar tidak ikut memperlambat
    // interaksi lain (hover, scroll-reveal, dll).
    root.classList.add('theme-transitioning')
    root.classList.toggle('dark', theme === 'dark')

    clearTimeout(timer.current)
    timer.current = setTimeout(() => root.classList.remove('theme-transitioning'), 450)

    try {
      localStorage.setItem('keyzai-theme', theme)
    } catch {
      // private mode — theme just won't persist
    }
  }, [theme])

  useEffect(() => () => clearTimeout(timer.current), [])

  return [theme, setTheme]
}
