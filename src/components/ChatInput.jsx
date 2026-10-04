import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, ChevronDown, Check } from 'lucide-react'
import { KeyMark } from '../lib/key-mark'
import { Textarea } from './ui/textarea'
import { MODELS } from '../lib/models'

function FreeBadge() {
  return <span className="text-[10px] font-medium text-emerald-600/90 dark:text-emerald-400/90">Free</span>
}

export function ModelPicker({ model, onModelChange }) {
  const [modelOpen, setModelOpen] = useState(false)
  const modelBtnRef = useRef(null)

  useEffect(() => {
    if (!modelOpen) return
    const onDocClick = (e) => {
      if (modelBtnRef.current && !modelBtnRef.current.contains(e.target)) setModelOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [modelOpen])

  const currentModel = MODELS.find((m) => m.id === model) || MODELS[0]
  if (!model || !onModelChange) return null
  if (MODELS.length <= 1) {
    // Hanya satu model: badge statis (bukan picker) — tetap menampilkan
    // nama model + label gratis, tanpa dead-weight dropdown.
    return (
      <div
        title={currentModel.id}
        className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-sm border border-foreground/10 bg-transparent px-2 text-[11px] font-medium text-muted-foreground"
      >
        <KeyMark className="h-3 w-3" />
        <span className="truncate">{currentModel.label}</span>
        {currentModel.free && <FreeBadge />}
      </div>
    )
  }
  return (
    <div ref={modelBtnRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setModelOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={modelOpen}
        aria-label="Pilih model"
        className="inline-flex h-6 items-center gap-1.5 rounded-sm border border-foreground/10 bg-transparent px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
      >
        <KeyMark className="h-3 w-3" />
        <span className="max-w-36 truncate">{currentModel.label}</span>
        {currentModel.free && <FreeBadge />}
        <ChevronDown className={`h-3 w-3 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
      </button>
      {modelOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setModelOpen(false)} />
          <ul
            role="listbox"
            className="absolute bottom-full left-0 z-50 mb-1.5 w-56 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md"
          >
            {MODELS.map((m) => {
              const active = m.id === model
              return (
                <li key={m.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onModelChange(m.id)
                      setModelOpen(false)
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                      active ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{m.label}</span>
                        {m.free && <FreeBadge />}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground/70">{m.id}</span>
                    </span>
                    {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

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
      // onSend boleh mengembalikan false untuk menandakan pesan belum benar-benar
      // terkirim (mis. muncul popup login) — teks dipertahankan di kolom.
      const sent = onSend(message)
      if (sent !== false) setMessage('')
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
    <div className="w-full">
      <div className="relative bg-transparent transition-colors">
        <div className="flex items-end gap-2 py-0.5 pl-8 pr-0.5">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              if (e.target.value.length <= maxChars) {
                setMessage(e.target.value)
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ada yang bisa dibantu?"
            className="max-h-40 min-h-[24px] flex-1 resize-none overflow-y-auto border-0 bg-transparent py-0.5 font-mono text-sm leading-relaxed text-foreground placeholder:font-mono placeholder:text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
          />
          {loading ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Hentikan generasi"
              className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-destructive/60 text-destructive transition-colors after:absolute after:-inset-2 after:content-[''] hover:bg-destructive hover:text-destructive-foreground"
            >
              <Square className="h-2.5 w-2.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim()}
              aria-label="Kirim pesan"
              className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-foreground/25 text-foreground transition-colors after:absolute after:-inset-2 after:content-[''] hover:border-foreground hover:bg-foreground hover:text-background disabled:opacity-30 disabled:hover:border-foreground/25 disabled:hover:bg-transparent disabled:hover:text-foreground"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
          )}
        </div>
        <span aria-hidden="true" className="tui-prompt pointer-events-none absolute left-3 top-1 select-none text-sm">›</span>
        {nearLimit && (
          <span className={`pointer-events-none absolute right-9 top-1 text-[10px] tabular-nums ${charCount > 1950 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {charCount}/{maxChars}
          </span>
        )}
      </div>
      {showDisclaimer && (
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] leading-none text-muted-foreground/70">
          <span className="hidden sm:block">KeyzAI bisa keliru. Cek kembali info penting.</span>
          <span className="sm:hidden">KeyzAI adalah AI dan bisa keliru.</span>
          <a
            href="https://github.com/keyzakyy-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 transition-colors hover:text-foreground"
          >
            by Keyzakyy.
          </a>
        </div>
      )}
    </div>
  )
}
