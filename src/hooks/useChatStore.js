import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { chatReducer } from '../state/chat-reducer.js'
import { loadState, saveState } from '../state/persistence.js'
import { getActivePath } from '../state/tree.js'

const STORAGE_FULL_MSG =
  'Penyimpanan penuh — riwayat baru tidak tersimpan. Ekspor percakapanmu lewat menu chat, lalu hapus yang lama.'

export function useChatStore() {
  const [state, dispatch] = useReducer(chatReducer, undefined, loadState)
  const [persistError, setPersistError] = useState(null)
  const lastErr = useRef(null)

  // Persist tertunda (debounce): selama streaming, delta datang tiap token —
  // gabungkan jadi satu tulis setelah aktivitas mereda.
  useEffect(() => {
    const t = setTimeout(() => {
      const err = saveState(state)
      if (err !== lastErr.current) {
        lastErr.current = err
        setPersistError(err ? STORAGE_FULL_MSG : null)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [state])

  const activeConv = useMemo(
    () => state.convs.find((c) => c.id === state.activeId) || null,
    [state.convs, state.activeId],
  )

  // Pesan yang dirender = rantai aktif pohon (bukan list datar).
  const messages = useMemo(() => getActivePath(activeConv), [activeConv])

  const loading = useMemo(
    () => messages.some((m) => m.state === 'streaming'),
    [messages],
  )

  return { state, dispatch, activeConv, messages, loading, persistError }
}
