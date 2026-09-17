import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { chatReducer } from '../state/chat-reducer.js'
import { loadState, saveState } from '../state/persistence.js'
import { getActivePath } from '../state/tree.js'
import { fetchConversations, saveConversation } from '../lib/sync.js'
import { isAuthenticated } from '../lib/auth.js'

const STORAGE_FULL_MSG =
  'Penyimpanan penuh — riwayat baru tidak tersimpan. Ekspor percakapanmu lewat menu chat, lalu hapus yang lama.'

export function useChatStore() {
  const [state, dispatch] = useReducer(chatReducer, undefined, loadState)
  const [persistError, setPersistError] = useState(null)
  const lastErr = useRef(null)
  const hydrated = useRef(false)

  // Hydrate dari D1 saat user login: server jadi sumber kebenaran.
  // Tanpa token, localStorage tetap dipakai (mode sebelum integrasi auth).
  useEffect(() => {
    if (hydrated.current || !isAuthenticated()) return
    hydrated.current = true
    let cancelled = false
    ;(async () => {
      try {
        const convs = await fetchConversations()
        if (cancelled || !Array.isArray(convs)) return
        dispatch({ type: 'REPLACE_ALL', convs })
      } catch {
        // jaringan gagal → localStorage yang dipakai
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Persist ke localStorage (debounce) + sinkron ke D1 untuk aksi penting.
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

  // Sinkron ke server hanya untuk aksi yang mengubah data persisten.
  const lastSynced = useRef('')
  useEffect(() => {
    if (!isAuthenticated()) return
    const active = state.convs.find((c) => c.id === state.activeId)
    if (!active) return
    const sig = `${active.id}:${active.updatedAt || active.createdAt}`
    if (sig === lastSynced.current) return
    lastSynced.current = sig
    saveConversation(active).catch(() => {
      // konflik/jaringan: retry ringan, tidak blok UI
      lastSynced.current = ''
    })
  }, [state.convs, state.activeId])

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
