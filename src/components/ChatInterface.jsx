import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { X, ArrowDown, CircleX, RotateCcw, ChevronDown, Pin, Pencil, Trash2, Download, Plus, FileText, MessageSquare, User, PanelRight } from 'lucide-react'
import { LogoImg } from '../lib/logo-img'
import { MODELS } from '../lib/models'

import { ChatMessage } from './ChatMessage'
import { ChatInput, ModelPicker } from './ChatInput'
import { MeshCanvas } from './MeshCanvas'
import { Button } from './ui/button'
import { ConfirmDialog } from './ui/confirm-dialog'
import { RenameDialog } from './ui/rename-dialog'
import { AnnouncementDialog } from './AnnouncementDialog'
import { LoginDialog } from './LoginDialog'
import { PreferencesDialog } from './PreferencesDialog'
import { OptionsContext } from './OptionCard'
import { applyPageMeta } from '../lib/seo'
import { loadModel, saveModel, isModelStored } from '../lib/models'
import { pickGreeting } from '../lib/greetings'
import { downloadConversation, downloadAll } from '../lib/backup'
import { useChatStore } from '../hooks/useChatStore'
import { useChatStream } from '../hooks/useChatStream'
import { useToast } from '../hooks/useToast'
import { useResizableSidebar } from '../hooks/useResizableSidebar'
import { usePreferences } from '../hooks/usePreferences'
import { useAuth } from '../hooks/useAuth'
import { isAuthenticated } from '../lib/auth'
import { removeConversation, deleteAllConversations } from '../lib/sync'
import { newId } from '../state/ids.js'
import { hasSiblings, navigateBranch, serializeConv } from '../state/tree.js'

export function ChatInterface() {
  const { state, dispatch, activeConv, messages, loading, persistError, refreshHistory, logoutReset, authExpired, ackAuthExpired } = useChatStore()
  const { send, stop } = useChatStream({ state, dispatch, loading })
  const { toast, notify, dismiss } = useToast()
  const { width: sidebarW, resizing, onDragStart, setWidth: setSidebarWidth, hasStoredWidth } = useResizableSidebar()

  const [model, setModel] = useState(loadModel)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  // ---------- TUI: tab inset panel kanan (menu / recent / account).
  const [panelTab, setPanelTab] = useState('menu')
  // Panel kanan jadi drawer di mobile agar kolom input tidak tertutup.
  const [panelOpen, setPanelOpen] = useState(false)
  // Announcement "sedang dalam pengembangan": sekali per sesi browser.
  const [announceOpen, setAnnounceOpen] = useState(() => {
    try {
      return sessionStorage.getItem('keyzai-announced') !== '1'
    } catch {
      return false
    }
  })

  const scrollAreaRef = useRef(null)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const currentTitle = activeConv?.title
  const error = state.error || persistError

  const { user, logout, loginWithGoogle, updateUser } = useAuth()

  // Sesi kedaluwarsa (401 dari API): bersihkan tampilan + minta login ulang.
  useEffect(() => {
    if (!authExpired) return
    ackAuthExpired()
    logoutReset()
    setLoginErr('Sesi berakhir. Silakan masuk kembali.')
    setLoginReason('expired')
    setPendingPreview(null)
    setLoginOpen(true)
  }, [authExpired, ackAuthExpired, logoutReset])

  // ---------------------------------------------------------------
  // Preferensi akun: sumber kebenaran di server; cache lokal untuk offline.
  // Saat preferensi server pertama dimuat, terapkan default (model & lebar
  // sidebar) hanya untuk perangkat yang belum pernah menyetel secara lokal.
  const applyPrefsDefaults = (p) => {
    if (!isModelStored()) {
      saveModel(p.default_model)
      setModel(p.default_model)
    }
    if (!hasStoredWidth()) {
      setSidebarWidth(p.sidebar_width)
    }
  }
  const { prefs, saving, error: prefsError, refresh: refreshPrefs, update: updatePrefs, saveDisplayName, reset: resetPrefs } =
    usePreferences({ onHydrated: applyPrefsDefaults })
  // ---------------------------------------------------------------

  // ---------------------------------------------------------------
  // Sapaan halaman kosong: berganti setiap "Chat baru", stabil saat mengetik.
  const lastGreeting = useRef(null)
  const [greeting, setGreeting] = useState(() =>
    pickGreeting({ previous: lastGreeting.current, name: user?.name }),
  )
  const nextGreeting = () => {
    const g = pickGreeting({ previous: lastGreeting.current, name: user?.name })
    lastGreeting.current = g
    setGreeting(g)
  }
  // ---------------------------------------------------------------

  const changeModel = (id) => { setModel(id); saveModel(id) }

  // Popup login: muncul saat user belum login mencoba mengirim pesan.
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginErr, setLoginErr] = useState(null)
  const [loginReason, setLoginReason] = useState('send')
  const [pendingPreview, setPendingPreview] = useState(null)

  // Isi yang "ditunda" sampai login selesai (mis. prompt ?q= dari halaman
  // fitur). Teks yang diketik user mengikuti jalur ChatInput (tidak di-snatch).
  const pendingRef = useRef(null)

  const handleLoginToken = async (idToken) => {
    setLoginErr(null)
    setLoginLoading(true)
    try {
      await loginWithGoogle(idToken)
      refreshPrefs()
      try {
        sessionStorage.setItem('keyzai-fresh-chat', '1')
      } catch {
        // abaikan
      }
      // force: re-hydrate meski sesi sebelumnya sempat 401 (hydrated direset).
      const freshId = (await refreshHistory(true)) || null
      const pending = pendingRef.current
      pendingRef.current = null
      setPendingPreview(null)
      setLoginOpen(false)
      if (pending) {
        sendRef.current?.({ content: pending, mode: 'new', model, convId: freshId || undefined })
      }
    } catch (e) {
      setLoginErr(e.message || 'Login gagal')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    logoutReset()
    resetPrefs()
    navigate('/', { replace: true })
  }

  const closeAnnounce = (open) => {
    setAnnounceOpen(open)
    if (!open) {
      try {
        sessionStorage.setItem('keyzai-announced', '1')
      } catch {
        // sessionStorage unavailable (private mode) — popup tidak akan ulang sesi ini
      }
    }
  }

  // ---------- aksi chat
  const handleSend = useCallback(
    (content) => {
      if (loading) return false
      if (!user) {
        setLoginErr(null)
        setLoginReason('send')
        setPendingPreview(null)
        setLoginOpen(true)
        return false // kolom tetap menyimpan teks
      }
      send({ content, mode: 'new', model })
      return true
    },
    [loading, send, model, user],
  )

  const handleEditSave = useCallback(
    (msgId, content) => {
      if (loading) return
      send({ content, mode: 'edit', editTargetId: msgId, model })
    },
    [loading, send, model],
  )

  // Regenerate: AI baru sebagai sibling jawaban lama — riwayat tetap ada
  // dan bisa diakses lewat panah cabang di ChatMessage.
  const handleRegenerate = useCallback(
    (aiMsgId) => {
      if (loading) return
      const ai = activeConv?.messages?.[aiMsgId]
      const userId = ai?.parentId
      if (!userId || activeConv.messages[userId]?.role !== 'user') return
      send({ mode: 'regenerate', regenerateFromId: userId, model })
    },
    [loading, activeConv, send, model],
  )

  const handleNavigateBranch = useCallback(
    (msgId, dir) => {
      dispatch({ type: 'NAVIGATE_BRANCH', convId: activeConv?.id, msgId, dir })
    },
    [dispatch, activeConv],
  )

  // ---------- percakapan
  const startNewChat = () => {
    nextGreeting()
    dispatch({ type: 'NEW_CHAT', convId: newId('conv') })
    setSidebarOpen(false)
    setEditingId(null)
    setMenuOpen(false)
    setRenameOpen(false)
  }

  // "Chat baru" selalu berpindah ke area kosong tanpa menghapus percakapan
  // lama (mereka tetap di sidebar) — jadi tidak butuh konfirmasi.
  const handleNewChat = () => {
    startNewChat()
  }

  // Retry setelah error = generate ulang jawaban dari pesan user terakhir
  // (sibling) — tidak menambah bubble user duplikat seperti "kirim ulang".
  const handleRetry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    send({ mode: 'regenerate', regenerateFromId: lastUser.id, model })
  }

  const handleSelectConv = (convId) => {
    dispatch({ type: 'SELECT_CHAT', convId })
    setSidebarOpen(false)
    setEditingId(null)
  }

  const togglePin = () => {
    if (!activeConv) return
    dispatch({ type: 'PIN', convId: activeConv.id, pinned: !activeConv.pinned })
  }

  const submitRename = (title) => {
    if (!activeConv) return
    dispatch({ type: 'RENAME', convId: activeConv.id, title })
  }

  const startEdit = (msgId) => {
    if (loading) return
    setEditingId(msgId)
  }

  const handleExportConv = () => {
    if (activeConv) downloadConversation(serializeConv(activeConv))
  }

  const handleExportAll = () => downloadAll(state.convs.map(serializeConv))

  // ---------- preferensi akun
  const handlePrefsSaveDisplayName = async (rawName) => {
    const nextUser = await saveDisplayName(rawName)
    if (nextUser) updateUser(nextUser)
    return nextUser
  }

  const handlePrefsUpdate = (patch) => updatePrefs(patch)

  const handlePrefsDeleteAll = async () => {
    await deleteAllConversations()
    dispatch({ type: 'CLEAR_ALL' })
    notify('Semua percakapan dihapus')
  }

  const handleDeleteConv = (convId) => {
    const conv = state.convs.find((c) => c.id === convId)
    setConfirm({
      title: 'Hapus percakapan ini?',
      description: `"${conv?.title || 'Percakapan ini'}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus',
      danger: true,
      onConfirm: () => {
        const removed = stateRef.current.convs.filter((c) => c.id === convId)
        dispatch({ type: 'DELETE_CONV', convId })
        removeConversation(convId).catch(() => {})
        notify(`"${conv?.title || 'Percakapan'}" dihapus`, () => {
          dispatch({ type: 'RESTORE', convs: removed, activeId: convId })
        })
      },
    })
  }

  // ---------- Esc: tutup drawer dulu kalau terbuka, kalau tidak
  // menghentikan streaming (sesuai hint di status bar).
  // Aman dari mode edit: edit pesan tidak bisa dibuka saat loading.
  const loadingRef = useRef(loading)
  useEffect(() => { loadingRef.current = loading }, [loading])
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (panelOpen) {
        setPanelOpen(false)
        return
      }
      if (loadingRef.current) {
        e.preventDefault()
        stop()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [stop, panelOpen])

  // ---------- scroll
  const scrollToBottom = () => {
    const el = scrollAreaRef.current
    // scrollTo container langsung — scrollIntoView ikut menggulung window (bug mobile)
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  const handleScroll = () => {
    const el = scrollAreaRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 150)
  }

  useEffect(() => {
    if (atBottom) scrollToBottom()
  }, [messages, loading, atBottom])

  useEffect(() => {
    applyPageMeta({
      title: currentTitle || 'Chat baru',
      path: state.activeId ? `/chat/${state.activeId}` : '/chat',
    })
  }, [currentTitle, state.activeId])

  // ---------- URL percakapan: /chat/:convId mencerminkan percakapan aktif.
  // Sinkron dua arah: buka/deep-link/back-forward → store; aksi app → URL.
  // `urlLeads` mencegah loop: saat URL yang memimpin, store→URL skip satu putaran.
  const { convId: convIdParam } = useParams()
  const navigate = useNavigate()
  const urlLeads = useRef(false)

  // auto-send dari query string (?q=…), dipasang paling awal supaya efek URL
  // lain tidak sempat mengalihkan URL sebelum percakapan baru tercipta.
  const [searchParams, setSearchParams] = useSearchParams()
  const autoSentRef = useRef(false)
  const sendRef = useRef(send)
  useEffect(() => {
    sendRef.current = send
  }, [send])
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])
  useEffect(() => {
    const q = searchParams.get('q')
    if (!q || autoSentRef.current) return
    autoSentRef.current = true
    setSearchParams({}, { replace: true })
    if (!userRef.current) {
      // Belum login? Prompt fitur jadi "pending" dan popup login yang muncul.
      pendingRef.current = q
      setPendingPreview(q)
      setLoginErr(null)
      setLoginReason('send')
      setLoginOpen(true)
      return
    }
    sendRef.current({ content: q, mode: 'new', model, convId: newId('conv') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams])

  // URL → store
  // Hanya saat ada session: anonim tidak boleh menciptakan activeId hantu
  // dari deep-link /chat/:convId (state-nya memang kosong bersih).
  useEffect(() => {
    if (!isAuthenticated()) return
    if (!convIdParam || state.activeId === convIdParam) return
    urlLeads.current = true
    const exists = state.convs.some((c) => c.id === convIdParam)
    dispatch({ type: exists ? 'SELECT_CHAT' : 'NEW_CHAT', convId: convIdParam })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convIdParam])

  // store → URL
  // Selama ?q= belum dikonsumsi, biarkan auto-send yang menentukan URL —
  // jangan dialihkan ke percakapan yang kebetulan tersimpan di store.
  // Guard auth: saat logout, jangan lompat balik ke /chat/:id.
  useEffect(() => {
    if (!isAuthenticated()) return
    if (urlLeads.current) {
      urlLeads.current = false
      return
    }
    if (searchParams.get('q')) return
    if (state.activeId && state.activeId !== convIdParam) {
      navigate(`/chat/${state.activeId}`, { replace: true })
    } else if (!state.activeId && convIdParam) {
      navigate('/chat', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeId])

  // ---------- state turunan untuk render
  // Panah navigasi cabang hanya tampil jika pesan punya sibling.
  const navStates = useMemo(
    () =>
      messages.map((m) => {
        if (!hasSiblings(activeConv, m.id)) return { prev: false, next: false }
        return {
          prev: navigateBranch(activeConv, m.id, 'prev') !== null,
          next: navigateBranch(activeConv, m.id, 'next') !== null,
        }
      }),
    [messages, activeConv],
  )

  // ---------- TUI panels: data turunan untuk panel kanan (SESSION + recent)
  const currentModelMeta = MODELS.find((m) => m.id === model) || MODELS[0]
  const recentConvs = useMemo(() => {
    const sortKey = (c) => c.updatedAt ?? c.createdAt ?? 0
    return [...state.convs].sort((a, b) => sortKey(b) - sortKey(a)).slice(0, 8)
  }, [state.convs])
  const sessionTokenEstimate = useMemo(() => {
    try {
      const chars = messages.reduce((n, m) => n + (m.content ? m.content.length : 0), 0)
      return Math.round(chars / 4)
    } catch { return 0 }
  }, [messages])
  const sessionCtxPct = Math.min(99, Math.round((sessionTokenEstimate / 256000) * 100))
  const sessionCtxFilled = Math.min(28, Math.round((sessionTokenEstimate / 256000) * 28))
  const tuiUserLabel = user?.name ? user.name.split(' ')[0].toLowerCase() : 'tamu'

  const lastMessage = messages[messages.length - 1]
  const optionsValue = useMemo(
    () => ({
      activeId: lastMessage?.role === 'assistant' ? lastMessage.id : null,
      loading,
      onSelect: handleSend,
    }),
    [lastMessage, loading, handleSend],
  )

  return (
    <div className="tui-root chat-mesh relative grid h-dvh grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden bg-background p-3 text-foreground lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[minmax(0,1fr)_auto]">
      {/* Mesh latar ala hero landing: di belakang panel (panel dibuat
          sedikit transparan via .chat-mesh .tui-panel), non-interaktif. */}
      <MeshCanvas
        label="Decorative animated network mesh background."
        className="pointer-events-none absolute inset-0 h-full w-full"
        strength={2.2}
        density={1.25}
      />
      {/* TUI: menu dipindah ke panel kanan (kolom Agents) */}
      {/* TUI: recent chat dipindah ke panel kanan (kolom Agents) */}
      <main className="flex min-h-0 min-w-0 flex-col gap-3 lg:h-full lg:min-h-0">
        <div className="tui-panel relative z-20 flex h-10 flex-shrink-0 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <Link to="/" className="shrink-0 font-semibold tracking-tight text-foreground hover:opacity-80">keyzai</Link>
            <span className="shrink-0 select-none text-muted-foreground/50" aria-hidden="true">·</span>
            <span className="min-w-0 truncate text-muted-foreground">{tuiUserLabel}</span>
            {activeConv || messages.length > 0 ? (
              <div className="relative hidden min-w-0 items-center gap-1 min-[480px]:flex">
                <span className="shrink-0 select-none text-muted-foreground/50" aria-hidden="true">·</span>
                <p className="min-w-0 truncate text-xs text-muted-foreground">
                  {currentTitle || 'Chat baru'}
                </p>
                {activeConv && (
                <div className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-label="Opsi chat"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <div
                        role="menu"
                        className="absolute top-full left-0 z-50 mt-1 w-48 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md"
                        onClick={() => setMenuOpen(false)}
                      >
                        <button
                          role="menuitem"
                          onClick={togglePin}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-foreground hover:bg-accent"
                        >
                          <Pin className={`h-3.5 w-3.5 ${activeConv.pinned ? 'fill-current' : ''}`} />
                          {activeConv.pinned ? 'Lepas sematan' : 'Sematkan'}
                        </button>
                        <button
                          role="menuitem"
                          onClick={() => setRenameOpen(true)}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-foreground hover:bg-accent"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Ganti nama
                        </button>
                        <button
                          role="menuitem"
                          onClick={handleExportConv}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-foreground hover:bg-accent"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Ekspor percakapan
                        </button>
                        <div className="my-1 h-px bg-border" />
                        <button
                          role="menuitem"
                          onClick={() => handleDeleteConv(activeConv.id)}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>
                    </>
                  )}
                </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 text-xs">
            {!user ? (
              <button type="button" onClick={() => { setLoginErr(null); setLoginReason('manual'); setPendingPreview(null); setLoginOpen(true) }} aria-label="Masuk" className="tui-tab-active px-1.5 py-0.5 font-semibold">
                masuk
              </button>
            ) : (
              <button type="button" onClick={() => setPrefsOpen(true)} title={user.email || undefined} className="max-w-24 truncate text-muted-foreground transition-colors hover:text-foreground">
                {tuiUserLabel}
              </button>
            )}
            <span className="select-none text-muted-foreground/40" aria-hidden="true">·</span>
            <button type="button" onClick={() => setPrefsOpen(true)} aria-label="Pengaturan" className="text-muted-foreground transition-colors hover:text-foreground">
              Settings
            </button>
            <button type="button" onClick={handleNewChat} aria-label="Chat baru" className="flex h-6 w-6 items-center justify-center border border-foreground/15 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
              <Plus className="h-3 w-3" />
            </button>
            <button type="button" onClick={() => setPanelOpen((o) => !o)} aria-label="Buka/tutup panel" aria-expanded={panelOpen} className="flex h-6 w-6 items-center justify-center border border-foreground/15 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground lg:hidden">
              <PanelRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="tui-panel relative flex min-h-0 flex-1 flex-col">
          <span className="tui-inset-title" aria-hidden="true">output</span>
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            className="relative flex h-full flex-col overflow-y-auto overscroll-contain px-4 py-5"
          >
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
              <div className="w-full max-w-2xl space-y-3 text-center">
                <p className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span className="inline-block h-1.5 w-1.5 bg-emerald-400" aria-hidden="true" />
                  session ready
                </p>
                <h1 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl md:text-4xl">
                  {greeting}
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  <span className="tui-prompt font-bold" aria-hidden="true">› </span>
                  ketik di bawah · Enter untuk kirim
                </p>
                {!user && (
                  <button type="button" onClick={() => { setLoginErr(null); setLoginReason('manual'); setPendingPreview(null); setLoginOpen(true) }} className="text-xs text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground">
                    masuk untuk menyimpan riwayat
                  </button>
                )}
              </div>
            </div>
          ) : (
            <OptionsContext.Provider value={optionsValue}>
            <div className="flex w-full flex-1 flex-col gap-6">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={msg.id}
                  id={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  genMs={msg.genMs}
                  streaming={msg.state === 'streaming'}
                  aborted={msg.state === 'aborted'}
                  onEdit={startEdit}
                  editing={msg.id === editingId}
                  onEditSave={handleEditSave}
                  onEditCancel={() => setEditingId(null)}
                  onRegenerate={handleRegenerate}
                  canPrev={navStates[i]?.prev}
                  canNext={navStates[i]?.next}
                  onNavigate={handleNavigateBranch}
                />
              ))}
              {error && (
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10">
                    <CircleX className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div className="min-w-0 space-y-2.5">
                    <p className="text-[15px] leading-relaxed text-foreground">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Coba lagi
                    </Button>
                  </div>
                </div>
              )}
            </div>
            </OptionsContext.Provider>
          )}
          </div>

          {!atBottom && messages.length > 0 && (
            <button
              onClick={() => {
                setAtBottom(true)
                scrollToBottom()
              }}
              aria-label="Gulir ke bawah"
              className="absolute bottom-4 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-sm border border-foreground/25 bg-background text-foreground transition-colors hover:border-foreground/40"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="tui-panel tui-queued relative flex-shrink-0 px-3 pb-1.5 pt-1.5">
          <span className="tui-inset-title tui-inset-accent" aria-hidden="true">{loading ? 'queued' : 'input'}</span>
          <ChatInput onSend={handleSend} loading={loading} onStop={stop} showDisclaimer={messages.length > 0} />
        </div>
      </main>

      <div className="relative flex flex-col gap-1 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] text-[11px] leading-relaxed lg:col-span-2" aria-live="polite">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="inline-flex items-center gap-1" aria-hidden="true">
            <span className={`inline-block h-1.5 w-1.5 ${loading ? 'bg-orange-400' : 'bg-emerald-400'}`} />
            <span className={`inline-block h-1.5 w-1.5 ${loading ? 'bg-orange-400/60' : 'bg-foreground/25'}`} />
            <span className="inline-block h-1.5 w-1.5 bg-foreground/25" />
          </span>
          {loading ? (
            <span><span className="text-foreground">Waiting for the model</span><span className="text-muted-foreground"> · Esc to stop</span></span>
          ) : (
            <span className="text-muted-foreground">siap · Enter untuk kirim · Shift+Enter baris baru</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className={`px-1 py-px text-[10px] font-bold uppercase tracking-wider ${loading ? 'tui-badge-working' : 'tui-badge-idle'}`}>{loading ? 'working' : 'idle'}</span>
          <span className="tui-accent font-semibold">keyzai</span>
          <span className="text-muted-foreground">·</span>
          <ModelPicker model={model} onModelChange={changeModel} />
          <span className="ml-auto shrink-0 tabular-nums text-muted-foreground/70">{messages.length} msgs · {sessionTokenEstimate.toLocaleString('en-US')} tok</span>
          <span className="hidden shrink-0 text-muted-foreground/60 sm:inline">Esc stop · Enter kirim</span>
        </div>
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setPanelOpen(false)} aria-hidden="true" />
      )}
      <aside className={`min-w-0 flex-col gap-3 border-l border-foreground/10 bg-background p-3 transition-transform duration-300 fixed right-0 top-0 z-40 flex h-dvh w-[340px] max-w-[88vw] overflow-y-auto ${panelOpen ? 'translate-x-0' : 'translate-x-full'} lg:static lg:z-auto lg:flex lg:h-full lg:w-auto lg:max-w-none lg:translate-x-0 lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:row-start-1 lg:col-start-2`} aria-label="Panel info">
        <section className="tui-panel relative shrink-0 px-4 pb-5 pt-6 text-xs leading-relaxed" aria-label="Session">
          <span className="tui-inset-title" aria-hidden="true">session</span>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            <dt className="text-muted-foreground">context</dt>
            <dd className="truncate text-right"><span className="tui-accent font-bold">~{sessionCtxPct}%</span> <span className="hidden text-muted-foreground/40 min-[420px]:inline">{'▓'.repeat(sessionCtxFilled)}{'░'.repeat(28 - sessionCtxFilled)}</span></dd>
            <dt className="text-muted-foreground">tokens</dt>
            <dd className="text-right text-foreground">~{sessionTokenEstimate.toLocaleString('en-US')} / 256,000</dd>
            <dt className="text-muted-foreground">used</dt>
            <dd className="text-right text-foreground">in {messages.filter((m) => m.role === 'user').length} · out {messages.filter((m) => m.role === 'assistant').length}</dd>
            <dt className="text-muted-foreground">cost</dt>
            <dd className="text-right text-foreground">$0.0000</dd>
            <dt className="text-muted-foreground">tools</dt>
            <dd className="text-right text-foreground">0 calls</dd>
            <dt className="text-muted-foreground">chats</dt>
            <dd className="text-right text-foreground">{state.convs.length}</dd>
            <dt className="text-muted-foreground">status</dt>
            <dd className="text-right text-foreground">{loading ? 'working' : 'idle'}</dd>
            <dt className="text-muted-foreground">messages</dt>
            <dd className="text-right text-foreground">{messages.length}</dd>
          </dl>
        </section>

        <section className="tui-panel relative flex min-h-[24dvh] flex-col px-4 pb-5 pt-6 text-xs leading-relaxed lg:min-h-0 lg:flex-1" aria-label="Panel menu">
          <nav className="tui-inset-title" aria-label="Navigasi panel">
            <button type="button" onClick={() => setPanelTab('menu')} aria-selected={panelTab === 'menu'} role="tab" className={panelTab === 'menu' ? 'tui-accent font-bold transition-opacity hover:opacity-70' : 'transition-colors hover:text-foreground'}>menu</button>
            <span aria-hidden="true"> · </span>
            <button type="button" onClick={() => setPanelTab('recent')} aria-selected={panelTab === 'recent'} role="tab" className={panelTab === 'recent' ? 'tui-accent font-bold transition-opacity hover:opacity-70' : 'transition-colors hover:text-foreground'}>recent</button>
            <span aria-hidden="true"> · </span>
            <button type="button" onClick={() => setPanelTab('account')} aria-selected={panelTab === 'account'} role="tab" className={panelTab === 'account' ? 'tui-accent font-bold transition-opacity hover:opacity-70' : 'transition-colors hover:text-foreground'}>account</button>
          </nav>
          <div className="border-b border-foreground/10 pb-4">
            <p className="text-muted-foreground">{loading ? 'menunggu model…' : 'idle · siap menerima perintah'}</p>
            <p className="mt-1 text-foreground">KeyzAI <span className="tui-accent font-semibold">›{currentModelMeta.label}</span></p>
          </div>
          <div className="min-h-0 pt-4">
            {panelTab === 'menu' && (
              <div>
                <p className="font-bold uppercase tracking-wider text-muted-foreground">menu</p>
                <div className="mt-1 space-y-0.5">
                  <button type="button" onClick={handleNewChat} className="flex w-full items-center gap-2 px-1 py-1 text-left text-foreground/80 transition-colors hover:text-foreground">
                    <Plus className="h-3 w-3 shrink-0 opacity-40" /> Chat baru
                  </button>
                  <Link to="/prd-builder" className="flex w-full items-center gap-2 px-1 py-1 text-left text-foreground/80 transition-colors hover:text-foreground">
                    <FileText className="h-3 w-3 shrink-0 opacity-40" /> PRD Builder <span className="text-muted-foreground/60">[Beta]</span>
                  </Link>
                </div>
              </div>
            )}
            {panelTab === 'recent' && (
              <div>
                <p className="font-bold uppercase tracking-wider text-muted-foreground">recent</p>
                {recentConvs.length === 0 ? (
                  <div className="mt-1">
                    <p className="text-foreground">Belum ada percakapan</p>
                    <p className="text-muted-foreground/70">Buka tab menu, tekan “Chat baru”.</p>
                  </div>
                ) : (
                  <ul className="mt-1 max-h-64 space-y-0.5 overflow-y-auto">
                    {recentConvs.map((conv) => (
                      <li key={conv.id} className={`group flex items-center gap-1 ${state.activeId === conv.id ? 'tui-row-active' : ''}`}>
                        <button type="button" onClick={() => handleSelectConv(conv.id)} title={conv.title || undefined} className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-left text-foreground/80 transition-colors hover:text-foreground">
                          <MessageSquare className="h-3 w-3 shrink-0 opacity-40" />
                          <span className="min-w-0 flex-1 truncate">{conv.title || 'Percakapan'}</span>
                        </button>
                        <button type="button" onClick={() => handleDeleteConv(conv.id)} aria-label="Hapus percakapan" className="shrink-0 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 max-lg:opacity-100">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {panelTab === 'account' && (
              <div>
                <p className="font-bold uppercase tracking-wider text-muted-foreground">account</p>
                {!user ? (
                  <button type="button" onClick={() => { setLoginErr(null); setLoginReason('manual'); setPendingPreview(null); setLoginOpen(true) }} className="mt-1 flex w-full items-center gap-2 px-1 py-1 text-left transition-colors hover:text-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-dashed border-foreground/25 text-muted-foreground">
                      <User className="h-3 w-3" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">Masuk</span>
                      <span className="block truncate text-muted-foreground/70">Riwayat belum tersimpan</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground/60" aria-hidden="true">›</span>
                  </button>
                ) : (
                  <button type="button" onClick={() => setPrefsOpen(true)} className="mt-1 flex w-full items-center gap-2 px-1 py-1 text-left transition-colors hover:text-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden border border-foreground/20 text-foreground">
                      {user.picture ? (
                        <img src={user.picture} alt={user.name || 'Akun'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-[11px] font-semibold">{(user.name || user.email || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">{user.name || 'Pengguna'}</span>
                      {user.email && <span className="block truncate text-muted-foreground/70">{user.email}</span>}
                    </span>
                    <span className="shrink-0 text-muted-foreground/60" aria-hidden="true">›</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

      </aside>

      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        value={activeConv?.title || ''}
        onSave={submitRename}
      />
      <PreferencesDialog
        open={prefsOpen}
        onOpenChange={setPrefsOpen}
        user={user}
        prefs={prefs}
        saving={saving}
        error={prefsError}
        conversations={state.convs}
        onSaveDisplayName={handlePrefsSaveDisplayName}
        onUpdatePrefs={handlePrefsUpdate}
        onDeleteAll={handlePrefsDeleteAll}
        onExportAll={handleExportAll}
        onLogout={handleLogout}
      />
      <AnnouncementDialog open={announceOpen} onOpenChange={closeAnnounce} />
      <LoginDialog
        open={loginOpen}
        onOpenChange={(o) => {
          setLoginOpen(o)
          if (!o) {
            setLoginErr(null)
            // popup ditutup tanpa login → buang pending total, jangan
            // terlanjur terkirim di login berikutnya.
            pendingRef.current = null
            setPendingPreview(null)
          }
        }}
        onIdToken={handleLoginToken}
        loading={loginLoading}
        error={loginErr}
        reason={loginReason}
        pendingMessage={pendingPreview}
      />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={confirm?.onConfirm}
      />

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 sm:bottom-24">
          <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full border border-border bg-popover px-4 py-2 shadow-lg animate-fade-up" style={{ animationDuration: '220ms' }}>
            <p className="truncate text-sm text-foreground">{toast.label}</p>
            {toast.undo && (
              <button
                type="button"
                onClick={() => { toast.undo(); dismiss() }}
                className="shrink-0 text-sm font-medium text-primary hover:underline"
              >
                Urungkan
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Tutup notifikasi"
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
