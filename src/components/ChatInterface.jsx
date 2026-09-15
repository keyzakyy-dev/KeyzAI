import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { Sidebar } from './Sidebar'
import { Sun, Moon, Menu, X, ArrowDown, PanelLeftClose, PanelLeftOpen, AlertCircle, RotateCcw, ChevronDown, Pin, Pencil, Trash2 } from 'lucide-react'
import { sendMessageStream, generateTitle } from '../api'
import { Button } from './ui/button'
import { ConfirmDialog } from './ui/confirm-dialog'
import { RenameDialog } from './ui/rename-dialog'
import { useTheme } from '../lib/use-theme'
import { applyPageMeta } from '../lib/seo'
import { loadModel, saveModel } from '../lib/models'

const SIDEBAR_MIN = 220
const SIDEBAR_MAX = 420

function initialSidebarW() {
  try {
    const n = Number(localStorage.getItem('keyzai-sidebar-w'))
    if (n >= SIDEBAR_MIN && n <= SIDEBAR_MAX) return n
  } catch {
    // storage unavailable — default width
  }
  return 256
}

function loadState() {
  try {
    const raw = localStorage.getItem('keyzai-state')
    if (!raw) return { convs: [], activeId: null }
    const parsed = JSON.parse(raw)
    const convs = Array.isArray(parsed.convs)
      ? parsed.convs.filter((c) => c && c.id && Array.isArray(c.messages))
      : []
    const activeId = convs.some((c) => c.id === parsed.activeId) ? parsed.activeId : null
    return { convs, activeId }
  } catch {
    return { convs: [], activeId: null }
  }
}

export function ChatInterface() {
  const [initialState] = useState(() => {
    const s = loadState()
    // Self-heal: any conversation left with null title gets a fallback from its first user msg.
    s.convs = s.convs.map((c) => {
      if (c.title) return { ...c, titlePending: false }
      const first = c.messages.find((m) => m.role === 'user')?.content || ''
      const fb = first.length > 30 ? first.slice(0, 30) + '...' : first
      return { ...c, title: fb || 'Chat', titlePending: false }
    })
    return s
  })
  const [conversations, setConversations] = useState(initialState.convs)
  const [currentConvId, setCurrentConvId] = useState(initialState.activeId)
  const [messages, setMessages] = useState(
    () => initialState.convs.find((c) => c.id === initialState.activeId)?.messages || []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [theme, setTheme] = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lastSent, setLastSent] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [atBottom, setAtBottom] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarW, setSidebarW] = useState(initialSidebarW)
  const [resizing, setResizing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [model, setModel] = useState(loadModel)
  const scrollAreaRef = useRef(null)
  const abortRef = useRef(null)

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const changeModel = (id) => { setModel(id); saveModel(id) }

  const startResize = (e) => {
    e.preventDefault()
    setResizing(true)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    let w = sidebarW
    const onMove = (ev) => {
      w = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, ev.clientX))
      setSidebarW(w)
    }
    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      setResizing(false)
      try {
        localStorage.setItem('keyzai-sidebar-w', String(w))
      } catch {
        // storage unavailable — width just won't persist
      }
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

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

  const currentConv = conversations.find((c) => c.id === currentConvId)
  const currentTitle = currentConv?.title

  const togglePin = () => {
    if (!currentConv) return
    patchConv(currentConv.id, { pinned: !currentConv.pinned })
  }

  const submitRename = (title) => {
    if (!currentConvId) return
    patchConv(currentConvId, { title, titlePending: false })
  }

  useEffect(() => {
    applyPageMeta({
      title: currentTitle || 'Chat baru',
      path: '/chat',
    })
  }, [currentTitle])

  useEffect(() => {
    try {
      localStorage.setItem(
        'keyzai-state',
        JSON.stringify({ convs: conversations, activeId: currentConvId })
      )
    } catch {
      // storage unavailable — conversations just won't persist
    }
  }, [conversations, currentConvId])

  const startNewChat = () => {
    const newConvId = `conv_${Date.now()}`
    setCurrentConvId(newConvId)
    setMessages([])
    setError(null)
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
    setCurrentConvId(convId)
    const conv = conversations.find((c) => c.id === convId)
    setMessages(conv?.messages || [])
    setError(null)
    setSidebarOpen(false)
    setEditingId(null)
  }

  const patchConv = (id, patch) =>
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const startEdit = (msgId) => {
    if (loading) return
    setEditingId(msgId)
  }

  const runSend = async (content, editTargetId = null, regenerateIndex = null) => {
    if (loading) return
    setError(null)
    setLastSent(content)
    setAtBottom(true)
    const convId = currentConvId || `conv_${Date.now()}`
    if (convId !== currentConvId) setCurrentConvId(convId)
    const now = Math.floor(Date.now() / 1000)
    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: now,
    }
    const aiMsg = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: now,
      streaming: true,
    }

    const isEdit = editTargetId != null
    let history
    if (regenerateIndex != null) {
      // regenerate: keep messages up to (incl.) the user question, re-ask with a fresh AI bubble
      history = [...messages.slice(0, regenerateIndex + 1), aiMsg]
    } else if (isEdit) {
      // replace the edited message and drop everything after it
      const base = [...messages]
      const idx = base.findIndex((m) => m.id === editTargetId)
      if (idx !== -1) {
        base.splice(idx, 1, { ...userMsg, id: editTargetId })
        history = [...base, aiMsg]
      } else {
        history = [...messages, userMsg, aiMsg]
      }
    } else {
      history = [...messages, userMsg, aiMsg]
    }
    setMessages(history)
    if (isEdit) setEditingId(null)
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller
    let streamed = false

    // konteks utk model: max 20 turn terakhir, diurut s.d. pesan user terkini
    const ctx = history
      .slice(0, -1)
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const text = await sendMessageStream(
        content,
        (partial) => {
          streamed = true
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsg.id ? { ...m, content: partial } : m))
          )
        },
        controller.signal,
        model,
        ctx
      )
      const finalMessages = history.map((m) =>
        m.id === aiMsg.id ? { ...m, content: text, streaming: false } : m
      )
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsg.id ? { ...m, content: text, streaming: false } : m))
      )
      const fallbackTitle =
        content.length > 30 ? content.slice(0, 30) + '...' : content
      const isNewConversation = !conversations.some((c) => c.id === convId)
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === convId)
        if (existing) {
          return prev.map((c) => (c.id === convId ? { ...c, messages: finalMessages } : c))
        }
        return [...prev, { id: convId, title: fallbackTitle, titlePending: true, createdAt: Date.now(), messages: finalMessages }]
      })
      if (isNewConversation) {
        generateTitle(content, text, model)
          .then((t) => patchConv(convId, { title: t || fallbackTitle, titlePending: false }))
          .catch(() => patchConv(convId, { title: fallbackTitle, titlePending: false }))
      }
    } catch (err) {
      console.error('Error:', err)
      const aborted = err.name === 'AbortError'
      if (!aborted) setError(err.message || 'Gagal mengirim pesan')
      if (aborted && !streamed) {
        // stopped before any token arrived — drop the empty bubble
        setMessages((prev) => prev.filter((m) => m.id !== aiMsg.id))
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsg.id ? { ...m, streaming: false } : m))
        )
      }
    } finally {
      abortRef.current = null
      setLoading(false)
    }
  }

  const handleSend = (content) => runSend(content, null)

  const handleEditSave = (msgId, content) => runSend(content, msgId)

  const handleRegenerate = (aiMsgId) => {
    if (loading) return
    const idx = messages.findIndex((m) => m.id === aiMsgId)
    if (idx < 1) return
    let userIdx = idx - 1
    while (userIdx >= 0 && messages[userIdx].role !== 'user') userIdx--
    if (userIdx < 0) return
    runSend(messages[userIdx].content, null, userIdx)
  }

  const handleStop = () => {
    abortRef.current?.abort()
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const autoSentRef = useRef(false)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !autoSentRef.current) {
      autoSentRef.current = true
      setSearchParams({}, { replace: true })
      handleSend(q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleDeleteConv = (convId) => {
    const conv = conversations.find((c) => c.id === convId)
    setConfirm({
      title: 'Hapus percakapan ini?',
      description: `"${conv?.title || 'Percakapan ini'}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus',
      danger: true,
      onConfirm: () => {
        setConversations((prev) => prev.filter((c) => c.id !== convId))
        if (currentConvId === convId) {
          setCurrentConvId(null)
          setMessages([])
        }
      },
    })
  }

  const handleClearAll = () => {
    if (conversations.length === 0) return
    setConfirm({
      title: 'Hapus semua percakapan?',
      description: 'Semua percakapan akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.',
      confirmLabel: 'Hapus semua',
      danger: true,
      onConfirm: () => {
        setConversations([])
        setCurrentConvId(null)
        setMessages([])
        setError(null)
      },
    })
  }

  return (
    <div className="flex h-dvh bg-background text-foreground" style={{ '--sidebar-w': `${sidebarW}px` }}>
      <Sidebar
        conversations={conversations}
        currentId={currentConvId}
        onSelect={handleSelectConv}
        onNew={handleNewChat}
        onDelete={handleDeleteConv}
        onClear={handleClearAll}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onDragStart={startResize}
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
            {currentConv || messages.length > 0 ? (
              <div className="flex min-w-0 items-center gap-0.5">
                <p className="min-w-0 truncate text-sm font-medium text-foreground">
                  {currentTitle || 'Chat baru'}
                </p>
                {currentConv && (
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
                          <Pin className={`h-3.5 w-3.5 ${currentConv.pinned ? 'fill-current' : ''}`} />
                          {currentConv.pinned ? 'Lepas sematan' : 'Sematkan'}
                        </button>
                        <button
                          role="menuitem"
                          onClick={() => setRenameOpen(true)}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-foreground hover:bg-accent"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Ganti nama
                        </button>
                        <div className="my-1 h-px bg-border" />
                        <button
                          role="menuitem"
                          onClick={() => handleDeleteConv(currentConvId)}
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
            <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  id={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  streaming={msg.streaming}
                  onEdit={startEdit}
                  editing={msg.id === editingId}
                  onEditSave={handleEditSave}
                  onEditCancel={() => setEditingId(null)}
                  onRegenerate={handleRegenerate}
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
            <ChatInput onSend={handleSend} loading={loading} onStop={handleStop} showDisclaimer model={model} onModelChange={changeModel} />
          </div>
        )}
      </main>

      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        value={currentConv?.title || ''}
        onSave={submitRename}
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
    </div>
  )
}
