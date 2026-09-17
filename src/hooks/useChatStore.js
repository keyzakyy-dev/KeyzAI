import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { chatReducer } from '../state/chat-reducer.js'
import { loadState, saveState } from '../state/persistence.js'
import { getActivePath } from '../state/tree.js'
import { fetchConversations, fetchConversation, saveConversation } from '../lib/sync.js'
import { isAuthenticated } from '../lib/auth.js'
import { newId } from '../state/ids.js'

const STORAGE_FULL_MSG =
  'Penyimpanan penuh — riwayat baru tidak tersimpan. Ekspor percakapanmu lewat menu chat, lalu hapus yang lama.'

// Set oleh landing page tepat setelah login berhasil. Saat init, store menempatkan
// user di chat baru meskipun punya riwayat — riwayat tetap di sidebar.
const FRESH_CHAT_KEY = 'keyzai-fresh-chat'

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
      let fresh = false
      try {
        fresh = sessionStorage.getItem(FRESH_CHAT_KEY) === '1'
        if (fresh) sessionStorage.removeItem(FRESH_CHAT_KEY)
      } catch {
        // sessionStorage unavailable — abaikan flag
      }
      if (!cancelled && fresh) {
        dispatch({ type: 'NEW_CHAT', convId: newId('conv') })
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

  // List dari D1 hanya metadata (tanpa pohon pesan). Saat percakapan server
  // dibuka dan belum punya isi, ambil detail lengkapnya. Conv lokal baru punya
  // messages langsung setelah START_SEND, jadi tak terpancing fetch.
  const loadingFull = useRef('')
  useEffect(() => {
    if (!isAuthenticated()) return
    if (!state.activeId) return
    const conv = state.convs.find((c) => c.id === state.activeId)
    if (!conv) return
    const hasMsgs = conv.messages && typeof conv.messages === 'object' && Object.keys(conv.messages).length > 0
    if (hasMsgs) return
    const key = `full:${conv.id}:${conv.updatedAt || conv.createdAt || ''}`
    if (loadingFull.current === key) return
    loadingFull.current = key
    fetchConversation(conv.id)
      .then((full) => {
        if (loadingFull.current !== key) return
        loadingFull.current = ''
        if (full?.messages && Object.keys(full.messages).length > 0) {
          dispatch({ type: 'MERGE_CONV', conv: full })
        }
      })
      .catch(() => {
        if (loadingFull.current === key) loadingFull.current = ''
      })
  }, [state.convs, state.activeId])

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
