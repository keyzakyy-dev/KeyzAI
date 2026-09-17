import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sun, Moon, Menu, X, ArrowDown, PanelLeftClose, PanelLeftOpen, AlertCircle, RotateCcw, ChevronDown, Pin, Pencil, Trash2, Download } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { Sidebar } from './Sidebar'
import { Button } from './ui/button'
import { ConfirmDialog } from './ui/confirm-dialog'
import { RenameDialog } from './ui/rename-dialog'
import { AnnouncementDialog } from './AnnouncementDialog'
import { OptionsContext } from './OptionCard'
import { useTheme } from '../lib/use-theme'
import { applyPageMeta } from '../lib/seo'
import { loadModel, saveModel } from '../lib/models'
import { downloadConversation, downloadAll } from '../lib/backup'
import { useChatStore } from '../hooks/useChatStore'
import { useChatStream } from '../hooks/useChatStream'
import { useToast } from '../hooks/useToast'
import { useResizableSidebar } from '../hooks/useResizableSidebar'
import { newId } from '../state/ids.js'
import { hasSiblings, navigateBranch, serializeConv } from '../state/tree.js'

export function ChatInterface() {
  const { state, dispatch, activeConv, messages, loading, persistError } = useChatStore()
  const { send, stop } = useChatStream({ state, dispatch, loading })
  const { toast, notify, dismiss } = useToast()
  const { width: sidebarW, resizing, onDragStart } = useResizableSidebar()

  const [theme, setTheme] = useTheme()
  const [model, setModel] = useState(loadModel)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
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
  const lastSent = state.lastSent

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const changeModel = (id) => { setModel(id); saveModel(id) }

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
      if (loading) return
      send({ content, mode: 'new', model })
    },
    [loading, send, model],
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
    dispatch({ type: 'NEW_CHAT', convId: newId('conv') })
    setSidebarOpen(false)
    setEditingId(null)
    setMenuOpen(false)
    setRenameOpen(false)
  }

  const handleNewChat = () => {
    if (loading) return
    if (messages.length === 0) {
      startNewChat()
      return
    }
    setConfirm({
      title: 'Mulai chat baru?',
      description: 'Pesan saat ini di chat ini akan dibuang.',
      confirmLabel: 'Chat baru',
      onConfirm: startNewChat,
    })
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
        notify(`"${conv?.title || 'Percakapan'}" dihapus`, () => {
          dispatch({ type: 'RESTORE', convs: removed, activeId: convId })
        })
      },
    })
  }

  const handleClearAll = () => {
    if (state.convs.length === 0) return
    setConfirm({
      title: 'Hapus semua percakapan?',
      description: 'Semua percakapan akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.',
      confirmLabel: 'Hapus semua',
      danger: true,
      onConfirm: () => {
        const snapshot = stateRef.current.convs
        dispatch({ type: 'CLEAR_ALL' })
        notify(`${snapshot.length} percakapan dihapus`, () => {
          dispatch({ type: 'RESTORE', convs: snapshot, activeId: snapshot[0]?.id || null })
        })
      },
    })
  }

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
      path: '/chat',
    })
  }, [currentTitle])

  // ---------- auto-send dari query string (?q=…)
  const [searchParams, setSearchParams] = useSearchParams()
  const autoSentRef = useRef(false)
  const sendRef = useRef(handleSend)
  useEffect(() => {
    sendRef.current = handleSend
  }, [handleSend])
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !autoSentRef.current) {
      autoSentRef.current = true
      setSearchParams({}, { replace: true })
      sendRef.current(q)
    }
  }, [searchParams, setSearchParams])

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
    <div className="flex h-dvh bg-background text-foreground" style={{ '--sidebar-w': `${sidebarW}px` }}>
      <Sidebar
        conversations={state.convs}
        currentId={state.activeId}
        onSelect={handleSelectConv}
        onNew={handleNewChat}
        onDelete={handleDeleteConv}
        onClear={handleClearAll}
        onExport={handleExportAll}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onDragStart={onDragStart}
      />
      <main className={`flex min-w-0 flex-1 flex-col ${collapsed || resizing ? '' : 'transition-[margin] duration-300'} ${collapsed ? '' : 'lg:ml-[var(--sidebar-w)]'}`}>
        <header className="relative z-20 flex h-14 flex-shrink-0 items-center justify-between bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex -ml-2"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
            {activeConv || messages.length > 0 ? (
              <div className="flex min-w-0 items-center gap-0.5">
                <p className="min-w-0 truncate text-sm font-medium text-foreground">
                  {currentTitle || 'Chat baru'}
                </p>
                {activeConv && (
                <div className="relative flex-shrink-0">
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
                        className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md"
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

          <div className="flex flex-shrink-0 items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Ganti tema">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Buka/tutup sidebar"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className="relative flex-1 min-h-0">
          <div className="pointer-events-none absolute inset-0 bg-dots opacity-60 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_42%,black,transparent)]" />
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            className="relative flex h-full flex-col overflow-y-auto overscroll-contain"
          >
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
              <div className="w-full max-w-2xl space-y-4">
                <h1 className="text-center font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl md:text-4xl">
                  Ada yang bisa dibantu?
                </h1>

                <ChatInput onSend={handleSend} loading={loading} model={model} onModelChange={changeModel} />
              </div>
            </div>
          ) : (
            <OptionsContext.Provider value={optionsValue}>
            <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={msg.id}
                  id={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
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
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div className="min-w-0 space-y-2.5">
                    <p className="text-[15px] leading-relaxed text-foreground">{error}</p>
                    {lastSent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSend(lastSent)}
                        className="gap-1.5"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Coba lagi
                      </Button>
                    )}
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
              className="absolute bottom-4 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-lg transition-colors hover:bg-accent"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          )}
        </div>

        {messages.length > 0 && (
          <div className="flex-shrink-0 bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <ChatInput onSend={handleSend} loading={loading} onStop={stop} showDisclaimer model={model} onModelChange={changeModel} />
          </div>
        )}
      </main>

      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        value={activeConv?.title || ''}
        onSave={submitRename}
      />
      <AnnouncementDialog open={announceOpen} onOpenChange={closeAnnounce} />
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
