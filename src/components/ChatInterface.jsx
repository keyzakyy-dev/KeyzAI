import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { Sidebar } from './Sidebar'
import { Plus, Sun, Moon, Menu, X, ArrowDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { sendMessageStream, generateTitle } from '../api'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { ConfirmDialog } from './ui/confirm-dialog'
import { useTheme } from '../lib/use-theme'

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
  const scrollAreaRef = useRef(null)
  const abortRef = useRef(null)

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

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
  }

  const patchConv = (id, patch) =>
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const handleSend = async (content) => {
    if (loading) return
    setError(null)
    setLastSent(content)
    setAtBottom(true)
    const convId = currentConvId || `conv_${Date.now()}`
    if (convId !== currentConvId) setCurrentConvId(convId)
    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Math.floor(Date.now() / 1000),
    }
    const aiMsg = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: Math.floor(Date.now() / 1000),
      streaming: true,
    }
    const history = [...messages, userMsg, aiMsg]
    setMessages((prev) => [...prev, userMsg, aiMsg])
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
    <div className="flex h-dvh bg-background text-foreground">
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
      />
      <main className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ${collapsed ? '' : 'lg:ml-64'}`}>
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
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New chat</span>
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
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            className="flex h-full flex-col overflow-y-auto overscroll-contain"
          >
          {messages.length === 0 ? (
            <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
              <div className="pointer-events-none absolute inset-0 bg-dots opacity-60 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_42%,black,transparent)]" />
              <div className="relative w-full max-w-2xl space-y-4">
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
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  streaming={msg.streaming}
                />
              ))}
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

        {error && (
          <div className="flex-shrink-0 border-t border-border px-4 py-4">
            <div className="mx-auto max-w-3xl">
              <Alert variant="destructive">
                <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {error}
                  {lastSent && (
                    <button
                      onClick={() => handleSend(lastSent)}
                      className="font-semibold underline underline-offset-2 hover:opacity-80"
                    >
                      Retry
                    </button>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

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
