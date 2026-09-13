import { useState, useEffect } from 'react'

function getInitialTheme() {
  try {
    return localStorage.getItem('keyzai-theme') || 'dark'
  } catch {
    return 'dark'
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('keyzai-theme', theme)
    } catch {
      // private mode — theme just won't persist
    }
  }, [theme])
  return [theme, setTheme]
}
