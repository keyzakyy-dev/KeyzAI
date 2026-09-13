import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

export function ChatInput({ onSend, loading, onStop, showDisclaimer = false }) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
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
  const nearLimit = charCount > 1800

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            if (e.target.value.length <= maxChars) {
              setMessage(e.target.value)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="How can I help you today?"
          className="min-h-[52px] max-h-40 resize-none overflow-y-auto border-0 bg-transparent px-4 pt-3.5 pb-1 text-base text-foreground placeholder:text-transparent sm:placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
        />

        <div className="flex items-center justify-between gap-3 px-3 pb-2.5">
          <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
            {nearLimit ? (
              <span className={`tabular-nums ${charCount > 1950 ? 'text-destructive' : ''}`}>
                {charCount}/{maxChars}
              </span>
            ) : (
              <span className="hidden items-center gap-1.5 sm:flex">
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-foreground">↵</kbd>
                <span>kirim</span>
                <span className="opacity-40">·</span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-foreground">⇧↵</kbd>
                <span>baris baru</span>
              </span>
            )}
          </span>

          {loading ? (
            <Button
              onClick={onStop}
              size="icon"
              variant="destructive"
              className="h-8 w-8 flex-shrink-0 rounded-full"
              aria-label="Stop generating"
            >
              <Square className="h-3 w-3 fill-current" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              size="icon"
              className="h-8 w-8 flex-shrink-0 rounded-full"
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {showDisclaimer && (
        <div className="mt-2 flex flex-col items-center gap-1 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:gap-3">
          <span>KeyzAI can make mistakes. Consider checking important information.</span>
          <span className="shrink-0">build by Keyzakyy.</span>
        </div>
      )}
    </div>
  )
}
