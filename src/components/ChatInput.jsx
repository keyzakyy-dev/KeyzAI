import { useState, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

export function ChatInput({ onSend, loading, onStop }) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [message])

  const handleSend = () => {
    if (message.trim() && !loading) {
      onSend(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const charCount = message.length
  const maxChars = 2000

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="relative rounded-xl border border-border bg-card shadow-sm">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            if (e.target.value.length <= maxChars) {
              setMessage(e.target.value)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message KeyzAI..."
          className="!min-h-[52px] max-h-32 resize-none overflow-y-auto !border-0 !bg-transparent !pl-4 !pr-16 !pt-4 !pb-11 text-base text-foreground placeholder:text-muted-foreground !outline-none !focus-visible:ring-0 !focus-visible:ring-offset-0"
          rows={1}
        />

        <span className="pointer-events-none absolute bottom-1.5 left-3 text-xs tabular-nums text-muted-foreground">
          {charCount > 1800 ? `${charCount}/${maxChars}` : ''}
        </span>

        <div className="absolute bottom-1.5 right-2 flex items-center gap-1.5">
          {loading ? (
            <Button
              onClick={onStop}
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-md sm:h-8 sm:w-8"
              aria-label="Stop generating"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              size="icon"
              className="h-9 w-9 rounded-md sm:h-8 sm:w-8"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        KeyzAI can make mistakes. Consider checking important information.
      </p>
    </div>
  )
}
