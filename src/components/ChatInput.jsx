import { useState } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

export function ChatInput({ onSend, loading }) {
  const [message, setMessage] = useState('')

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
          value={message}
          onChange={(e) => {
            if (e.target.value.length <= maxChars) {
              setMessage(e.target.value)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message KeyzAI..."
          disabled={loading}
          className="!min-h-[52px] max-h-32 resize-none !border-0 !bg-transparent !pl-4 !pr-20 !pt-4 !pb-11 text-base text-foreground placeholder:text-muted-foreground !outline-none !focus-visible:ring-0 !focus-visible:ring-offset-0"
          rows={1}
        />

        <span className="pointer-events-none absolute bottom-1.5 left-3 text-xs tabular-nums text-muted-foreground">
          {charCount > 1800 ? `${charCount}/${maxChars}` : ''}
        </span>

        <div className="absolute bottom-1.5 right-2 flex items-center gap-1.5">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-8 sm:w-8"
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <Button
              onClick={handleSend}
              disabled={!message.trim() || loading}
              size="icon"
              className="h-9 w-9 rounded-md sm:h-8 sm:w-8"
              aria-label="Send message"
            >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        KeyzAI can make mistakes. Consider checking important information.
      </p>
    </div>
  )
}
