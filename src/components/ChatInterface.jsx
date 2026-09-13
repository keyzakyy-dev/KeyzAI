import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { Sidebar } from './Sidebar'
import { Zap, Sparkles, Plus, Sun, Moon, Menu, X } from 'lucide-react'
import { sendMessage } from '../api'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { useTheme } from '../lib/use-theme'

export function ChatInterface() {
  const [conversations, setConversations] = useState([])
  const [currentConvId, setCurrentConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [theme, setTheme] = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef(null)

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const currentTitle = conversations.find((c) => c.id === currentConvId)?.title

  const handleNewChat = () => {
    const newConvId = `conv_${Date.now()}`
    setCurrentConvId(newConvId)
    setMessages([])
    setError(null)
    setSidebarOpen(false)
  }

  const handleSelectConv = (convId) => {
    setCurrentConvId(convId)
    const conv = conversations.find((c) => c.id === convId)
    setMessages(conv?.messages || [])
    setError(null)
    setSidebarOpen(false)
  }

  const handleSend = async (content) => {
    setError(null)
    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Math.floor(Date.now() / 1000),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const response = await sendMessage(content)
      const aiMsg = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response.message,
        timestamp: Math.floor(Date.now() / 1000),
      }
      const finalMessages = [...newMessages, aiMsg]
      setMessages(finalMessages)
      if (currentConvId) {
        setConversations((prev) => {
          const existing = prev.find((c) => c.id === currentConvId)
          if (existing) {
            return prev.map((c) => (c.id === currentConvId ? { ...c, messages: finalMessages } : c))
          } else {
            return [...prev, { id: currentConvId, title: content.slice(0, 30) + '...', messages: finalMessages }]
          }
        })
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err.message || 'Failed to send message')
      setMessages(newMessages)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConv = (convId) => {
    setConversations((prev) => prev.filter((c) => c.id !== convId))
    if (currentConvId === convId) {
      setCurrentConvId(null)
      setMessages([])
    }
  }

  const handleClearAll = () => {
    if (window.confirm('Clear all conversations?')) {
      setConversations([])
      setCurrentConvId(null)
      setMessages([])
      setError(null)
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        conversations={conversations}
        currentId={currentConvId}
        onSelect={handleSelectConv}
        onNew={handleNewChat}
        onDelete={handleDeleteConv}
        onClear={handleClearAll}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex flex-1 flex-col lg:ml-64">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary lg:hidden">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
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

        <div className="flex flex-1 flex-col overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-4 py-12">
              <div className="w-full max-w-2xl space-y-7">
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg">
                    <Zap className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                      What can I help you with?
                    </h1>
                    <p className="font-medium text-muted-foreground">
                      Your AI thinking partner — ask anything, get answers in seconds.
                    </p>
                  </div>
                </div>

                <ChatInput onSend={handleSend} loading={loading} />
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-card">
                    <div className="flex items-center gap-1 px-4 py-3">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-typing-dot"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {error && (
          <div className="flex-shrink-0 border-t border-border px-4 py-4">
            <div className="mx-auto max-w-3xl">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="flex-shrink-0 border-t border-border bg-background p-4">
            <ChatInput onSend={handleSend} loading={loading} />
          </div>
        )}
      </main>
    </div>
  )
}
