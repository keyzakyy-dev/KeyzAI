import { Moon, Sun } from 'lucide-react'

// Ikon Sun/Moon dengan animasi spin saat tema berganti (elemen baru mount
// setiap toggle, jadi CSS animation di .theme-toggle-icon selalu jalan).
export function ThemeIcon({ theme, className = 'h-4 w-4' }) {
  const Icon = theme === 'dark' ? Sun : Moon
  return <Icon className={`theme-toggle-icon ${className}`} />
}
