import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, ChevronDown, Check } from 'lucide-react'
import { KeyMark } from '../lib/key-mark'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { MODELS } from '../lib/models'

function FreeBadge() {
  return (
    <span className="rounded-full bg-emerald-500/10 px-1.5 text-[10px] font-semibold leading-relaxed text-emerald-600 dark:text-emerald-400">
      Free
    </span>
  )
}

export function ChatInput({ onSend, loading, onStop, showDisclaimer = false, model, onModelChange }) {
  const [message, setMessage] = useState('')
  const [modelOpen, setModelOpen] = useState(false)
  const textareaRef = useRef(null)
  const modelBtnRef = useRef(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [message])

  useEffect(() => {
    if (!modelOpen) return
    const onDocClick = (e) => {
      if (modelBtnRef.current && !modelBtnRef.current.contains(e.target)) setModelOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [modelOpen])

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
  const currentModel = MODELS.find((m) => m.id === model) || MODELS[0]

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
          placeholder="Ada yang bisa dibantu?"
          className="min-h-[52px] max-h-40 resize-none overflow-y-auto border-0 bg-transparent px-4 pt-3.5 pb-1 text-base text-foreground placeholder:font-serif placeholder:text-sm placeholder:text-muted-foreground/80 focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
        />

        <div className="flex items-center justify-between gap-3 px-3 pb-2.5">
          <div className="flex min-w-0 items-center gap-2">
            {model && onModelChange &&
              (MODELS.length > 1 ? (
                <div ref={modelBtnRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setModelOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={modelOpen}
                    aria-label="Pilih model"
                    className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <KeyMark className="h-3 w-3" />
                    <span className="truncate">{currentModel.label}</span>
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
              ) : (
                // Hanya satu model: badge statis (bukan picker) — tetap menampilkan
                // nama model + label gratis, tanpa dead-weight dropdown.
                <div
                  title={currentModel.id}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-[11px] font-medium text-muted-foreground"
                >
                  <KeyMark className="h-3 w-3" />
                  <span className="truncate">{currentModel.label}</span>
                  {currentModel.free && <FreeBadge />}
                </div>
              ))}
            <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              {nearLimit ? (
                <span className={`tabular-nums ${charCount > 1950 ? 'text-destructive' : ''}`}>
                  {charCount}/{maxChars}
                </span>
              ) : (
                <span className="hidden items-center gap-1.5 lg:flex">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-foreground">↵</kbd>
                  <span>kirim</span>
                  <span className="opacity-40">·</span>
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-foreground">⇧↵</kbd>
                  <span>baris baru</span>
                </span>
              )}
            </span>
          </div>

          {loading ? (
            <Button
              onClick={onStop}
              size="icon"
              variant="destructive"
              className="h-8 w-8 flex-shrink-0 rounded-full"
              aria-label="Hentikan generasi"
            >
              <Square className="h-3 w-3 fill-current" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              size="icon"
              className="h-8 w-8 flex-shrink-0 rounded-full"
              aria-label="Kirim pesan"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
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
