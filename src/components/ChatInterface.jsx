import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { Sidebar } from './Sidebar'
import { Plus, Sun, Moon, Menu, X, ArrowDown, PanelLeftClose, PanelLeftOpen, AlertCircle, RotateCcw } from 'lucide-react'
import { sendMessageStream, generateTitle } from '../api'
import { Button } from './ui/button'
import { ConfirmDialog } from './ui/confirm-dialog'
import { useTheme } from '../lib/use-theme'

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

export function ChatInterface() {
  const [conversations, setConversations] = useState([])
  const [currentConvId, setCurrentConvId] = useState(null)
  const [messages, setMessages] = useState([])
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
  const scrollAreaRef = useRef(null)
  const abortRef = useRef(null)

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

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

  const currentTitle = conversations.find((c) => c.id === currentConvId)?.title

  useEffect(() => {
    document.title = currentTitle ? `${currentTitle} - KeyzAI` : 'New chat - KeyzAI'
    return () => {
      document.title = 'KeyzAI — Your AI Thinking Partner'
    }
  }, [currentTitle])

  const startNewChat = () => {
    const newConvId = `conv_${Date.now()}`
    setCurrentConvId(newConvId)
    setMessages([])
    setError(null)
    setSidebarOpen(false)
    setEditingId(null)
  }

  const handleNewChat = () => {
    if (loading) return
    if (messages.length === 0) {
      startNewChat()
      return
    }
    setConfirm({
      title: 'Start a new chat?',
      description: 'The current messages in this chat will be discarded.',
      confirmLabel: 'New chat',
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

  const runSend = async (content, editTargetId = null) => {
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
    if (isEdit) {
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

    try {
      const text = await sendMessageStream(
        content,
        (partial) => {
          streamed = true
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsg.id ? { ...m, content: partial } : m))
          )
        },
        controller.signal
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
        return [...prev, { id: convId, title: null, titlePending: true, createdAt: Date.now(), messages: finalMessages }]
      })
      if (isNewConversation) {
        generateTitle(content, text)
          .then((t) => patchConv(convId, { title: t || fallbackTitle, titlePending: false }))
          .catch(() => patchConv(convId, { title: fallbackTitle, titlePending: false }))
      }
    } catch (err) {
      console.error('Error:', err)
      const aborted = err.name === 'AbortError'
      if (!aborted) setError(err.message || 'Failed to send message')
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
      title: 'Delete this conversation?',
      description: `"${conv?.title || 'This conversation'}" will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete',
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
      title: 'Clear all conversations?',
      description: 'All conversations will be permanently deleted. This cannot be undone.',
      confirmLabel: 'Delete all',
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
        <header className="flex h-14 flex-shrink-0 items-center justify-between bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex -ml-2"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
            <p className="truncate text-sm font-medium text-foreground">
              {currentTitle || 'New chat'}
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1.5">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="hidden gap-1.5 text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                <Plus className="h-4 w-4" />
                New chat
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
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
                  What can I help you with?
                </h1>

                <ChatInput onSend={handleSend} loading={loading} />
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
                        Try again
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
              aria-label="Scroll to bottom"
              className="absolute bottom-4 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-lg transition-colors hover:bg-accent"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          )}
        </div>

        {messages.length > 0 && (
          <div className="flex-shrink-0 bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <ChatInput onSend={handleSend} loading={loading} onStop={handleStop} showDisclaimer />
          </div>
        )}
      </main>

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
