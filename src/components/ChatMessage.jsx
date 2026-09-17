import { useState, useRef, useEffect } from 'react'
import { Pencil, RotateCcw, Brain, ChevronLeft, ChevronRight } from 'lucide-react'
import { Markdown } from '../lib/markdown'
import { CopyButton } from '../lib/copy-button'

// Close an unterminated ``` fence so partial streaming text still renders formatted
function closeOpenFence(s) {
  return (s.match(/```/g)?.length || 0) % 2 === 1 ? s + '\n```' : s
}

const THINKING_WORDS = ['Berpikir…', 'Menelusuri…', 'Menulis…', 'Memoles…']

function ThinkingIndicator() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % THINKING_WORDS.length), 1100)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex items-center gap-2">
      <Brain
        className="animate-pulsing h-4 w-4 shrink-0 text-primary"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
      <div
        key={i}
        className="font-serif text-foreground thinking-fade"
        style={{ animationDuration: '400ms' }}
      >
        {THINKING_WORDS[i]}
      </div>
    </div>
  )
}

export function ChatMessage({ role, content, timestamp, streaming, aborted = false, id, onEdit, editing = false, onEditSave, onEditCancel, onRegenerate, canPrev = false, canNext = false, onNavigate }) {
  const isUser = role === 'user'
  const time = timestamp
    ? new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  const [draft, setDraft] = useState(content)
  const taRef = useRef(null)

  useEffect(() => {
    if (editing) setDraft(content)
  }, [editing, content])

  useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.setSelectionRange(taRef.current.value.length, taRef.current.value.length)
    }
  }, [editing])

  const handleSave = () => {
    const text = draft.trim()
    if (!text) return
    onEditSave(id, draft)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') onEditCancel?.()
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`min-w-0 space-y-1.5 ${isUser ? 'max-w-[90%]' : 'w-full'}`}>
        <div
          className={`text-[15px] leading-relaxed ${
            isUser
              ? 'rounded-2xl rounded-tr-md bg-secondary px-4 py-2 text-secondary-foreground sm:px-5'
              : 'font-serif text-foreground'
          }`}
        >
          {isUser && editing ? (
            <textarea
              ref={taRef}
              autoFocus
              value={draft}
              maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="block resize-none overflow-hidden bg-transparent text-base text-secondary-foreground focus:outline-none sm:text-[15px] [field-sizing:content]"
            />
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : streaming && !content ? (
            <ThinkingIndicator />
          ) : (
            <Markdown
              text={streaming ? closeOpenFence(content) : content}
              messageId={id}
              streaming={streaming}
            />
          )}
        </div>

        {isUser && editing ? (
          <div className="flex items-center justify-end gap-1.5 px-1">
            <button
              type="button"
              onClick={() => onEditCancel?.()}
              aria-label="Batalkan edit"
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!draft.trim()}
              aria-label="Simpan editan"
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity disabled:opacity-40"
            >
              Simpan
            </button>
          </div>
        ) : (
          !streaming && (
            <div className={`flex items-center gap-1 px-1 ${isUser ? 'justify-end' : ''}`}>
              {(canPrev || canNext) && (
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onNavigate?.(id, 'prev')}
                    disabled={!canPrev}
                    aria-label="Versi sebelumnya"
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(id, 'next')}
                    disabled={!canNext}
                    aria-label="Versi berikutnya"
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {aborted && (
                <span className="text-[11px] italic text-muted-foreground">Dihentikan</span>
              )}
              {time && <p className="text-[11px] text-muted-foreground">{time}</p>}
              {isUser && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(id)}
                  aria-label="Edit pesan"
                  className="flex items-center gap-1 rounded p-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {!isUser && onRegenerate && (
                <button
                  type="button"
                  onClick={() => onRegenerate(id)}
                  aria-label="Buat ulang respons"
                  title="Buat ulang"
                  className="flex items-center gap-1 rounded p-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <CopyButton text={content} />
            </div>
          )
        )}
      </div>
    </div>
  )
}