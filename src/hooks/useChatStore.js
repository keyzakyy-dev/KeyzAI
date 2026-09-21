import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { chatReducer } from '../state/chat-reducer.js'
import { freshState, loadState, saveState, clearState } from '../state/persistence.js'
import { getActivePath } from '../state/tree.js'
import { fetchConversations, fetchConversation, saveConversation } from '../lib/sync.js'
import { AuthError, isAuthenticated } from '../lib/auth.js'
import { newId } from '../state/ids.js'

const STORAGE_FULL_MSG =
  'Penyimpanan penuh, riwayat baru tidak tersimpan. Ekspor percakapanmu lewat menu chat, lalu hapus yang lama.'

// Set oleh landing page tepat setelah login berhasil. Saat init, store menempatkan
// user di chat baru meskipun punya riwayat — riwayat tetap di sidebar.
const FRESH_CHAT_KEY = 'keyzai-fresh-chat'

export function useChatStore() {
  // Riwayat lokal (localStorage) HANYA valid selama ada session. Tanpa token
  // (belum login / sudah logout / sesi kedaluwarsa) tampilan dimulai bersih —
  // riwayat milik akun tidak boleh tampil ke pengguna anonim.
  const [state, dispatch] = useReducer(chatReducer, undefined, () =>
    isAuthenticated() ? loadState() : freshState(),
  )
  const [persistError, setPersistError] = useState(null)
  // 401 dari API mana pun (sesi kedaluwarsa): komponen memicu re-login via popup.
  const [authExpired, setAuthExpired] = useState(false)
  const lastErr = useRef(null)
  const hydrated = useRef(false)
  // id → sig terakhir yang sudah sukses disimpan ke D1 (id:updatedAt).
  const lastSynced = useRef(new Map())

  // Hydrate dari D1: list → REPLACE_ALL; bila ada flag "fresh chat" (set tepat
  // setelah login), tempatkan user di chat baru. Mengembalikan activeId baru
  // (id chat baru) bila fresh, atau null.
  // Setelah hidrasi, data server dianggap sudah tersinkron: seed sig per-id
  // supaya REPLACE_ALL tidak langsung di-upload balik tanpa perubahan.
  const syncSig = (c) => `${c.id}:${c.updatedAt || c.createdAt || 0}`
  const seedSynced = (convs) => {
    const m = new Map()
    for (const c of convs) {
      if (c?.id) m.set(c.id, syncSig(c))
    }
    lastSynced.current = m
  }

  const refreshHistory = useCallback(async (force = false) => {
    if (hydrated.current && !force) return null
    hydrated.current = true
    try {
      const convs = await fetchConversations()
      if (Array.isArray(convs)) {
        seedSynced(convs)
        dispatch({ type: 'REPLACE_ALL', convs })
      }
    } catch (e) {
      // 401 = sesi berakhir (token dihapus authFetch) → tampilkan re-login,
      // jangan biarkan histori basi dari localStorage seolah masih valid.
      if (e instanceof AuthError) {
        hydrated.current = false
        setAuthExpired(true)
        return null
      }
      // jaringan gagal → state lokal tetap dipakai
    }
    let fresh = false
    try {
      fresh = sessionStorage.getItem(FRESH_CHAT_KEY) === '1'
      if (fresh) sessionStorage.removeItem(FRESH_CHAT_KEY)
    } catch {
      // sessionStorage unavailable — abaikan flag
    }
    if (fresh) {
      const id = newId('conv')
      dispatch({ type: 'NEW_CHAT', convId: id })
      return id
    }
    return null
  }, [dispatch])

  // Auto-hydrate saat session sudah ada sejak mount (visitor yang sudah login).
  useEffect(() => {
    if (isAuthenticated()) refreshHistory()
  }, [refreshHistory])

  // Logout (atau sesi berakhir): kosongkan tampilan + localStorage sekaligus,
  // dan siapkan hidrasi ulang untuk login berikutnya.
  const logoutReset = useCallback(() => {
    hydrated.current = false
    lastSynced.current = new Map()
    dispatch({ type: 'CLEAR_ALL' })
    dispatch({ type: 'NEW_CHAT', convId: newId('conv') })
    clearState()
  }, [dispatch])

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
      .catch((e) => {
        if (loadingFull.current === key) loadingFull.current = ''
        if (e instanceof AuthError) setAuthExpired(true)
      })
  }, [state.convs, state.activeId])

  // Sinkron ke server: SEMUA percakapan yang berubah `updatedAt` (turn selesai,
  // pin, rename, judul) disimpan — bukan hanya yang aktif. Debounce supaya
  // tidak banjir saat stream delta; sig per-id mencegah upload ulang data sama.
  useEffect(() => {
    if (!isAuthenticated()) return
    if (!hydrated.current) return // server masih sumber kebenaran sampai hidrasi
    const t = setTimeout(() => {
      for (const conv of state.convs) {
        if (!conv?.id) continue
        const sig = syncSig(conv)
        if (lastSynced.current.get(conv.id) === sig) continue
        lastSynced.current.set(conv.id, sig)
        saveConversation(conv).catch(() => {
          // gagal: buka lagi supaya perubahan berikutnya memicu retry
          if (lastSynced.current.get(conv.id) === sig) lastSynced.current.delete(conv.id)
        })
      }
    }, 600)
    return () => clearTimeout(t)
  }, [state.convs])

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

  const ackAuthExpired = useCallback(() => setAuthExpired(false), [])

  return { state, dispatch, activeConv, messages, loading, persistError, refreshHistory, logoutReset, authExpired, ackAuthExpired }
}
