import { useCallback, useEffect, useState } from 'react'

// Toast dengan undo: penghapusan dibatalkan dalam `timeout` (default 6 dtk).
export function useToast(timeout = 6000) {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), timeout)
    return () => clearTimeout(t)
  }, [toast, timeout])

  const notify = useCallback((label, undo) => setToast({ label, undo }), [])
  const dismiss = useCallback(() => setToast(null), [])

  return { toast, notify, dismiss }
}
