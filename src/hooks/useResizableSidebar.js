import { useCallback, useState } from 'react'

const SIDEBAR_MIN = 220
const SIDEBAR_MAX = 420
const STORAGE_KEY = 'keyzai-sidebar-w'

function initialWidth() {
  try {
    const n = Number(localStorage.getItem(STORAGE_KEY))
    if (n >= SIDEBAR_MIN && n <= SIDEBAR_MAX) return n
  } catch {
    // storage unavailable — default width
  }
  return 256
}

// Sidebar resizable (desktop): drag tepi kanan, lebar dipertahankan.
export function useResizableSidebar() {
  const [width, setWidth] = useState(initialWidth)
  const [resizing, setResizing] = useState(false)

  const onDragStart = useCallback(
    (e) => {
      e.preventDefault()
      setResizing(true)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
      let w = width
      const onMove = (ev) => {
        w = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, ev.clientX))
        setWidth(w)
      }
      const onUp = () => {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
        setResizing(false)
        try {
          localStorage.setItem(STORAGE_KEY, String(w))
        } catch {
          // storage unavailable — width just won't persist
        }
      }
      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
    },
    [width],
  )

  return { width, resizing, onDragStart }
}
