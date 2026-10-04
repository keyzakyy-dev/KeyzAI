import { useState, useRef, useEffect } from 'react'
import { ArrowUp, ChevronDown, Loader2 } from 'lucide-react'

import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { validateIdea } from '../../state/prd-model'

const EXAMPLES = [
  'Aplikasi absensi mahasiswa dengan QR Code untuk mahasiswa, dosen, dan admin.',
  'Marketplace makanan sehat yang menghubungkan pelanggan dengan dapur lokal.',
  'Aplikasi manajemen keuangan UMKM dengan laporan bulanan otomatis.',
]

const MAX_CHARS = 4000

/**
 * STEP 1 — sapaan + contoh ide. Render di panel output; komposernya
 * (IdeaComposer) tinggal di panel aksi bawah seperti kolom input di /chat.
 * Draf ide dimiliki halaman (PrdBuilderPage) supaya contoh bisa mengisinya.
 */
export function IdeaIntro({ showExamples, onSelect }) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="space-y-3 text-center">
        <h1 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Mau bikin apa?
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
          Satu kalimat cukup. AI akan menanyakan sisanya sampai PRD-mu siap dipakai.
        </p>
      </div>

      {showExamples && (
        <div className="mt-6">
          <p className="mb-2.5 text-center text-xs text-muted-foreground">Atau mulai dari contoh:</p>
          <div className="flex flex-col gap-1.5">
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex}
                type="button"
                onClick={() => onSelect(ex)}
                className="group flex items-baseline gap-3 rounded-sm border border-border bg-background px-3.5 py-3 text-left transition-colors hover:border-foreground/30 hover:bg-accent/30 sm:py-2.5"
              >
                <span className="flex-shrink-0 text-[11px] tabular-nums text-muted-foreground group-hover:text-foreground">
                  0{i + 1}
                </span>
                <span className="min-w-0 flex-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground sm:text-[13px]">
                  {ex}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Komposer ide untuk panel aksi bawah. Tanpa bingkai panel sendiri karena
 * sudah dibungkus panel aksi oleh layout (seperti ChatInput di /chat).
 * Draf controlled dari halaman; status sentuh всплы validation lokal.
 */
export function IdeaComposer({
  idea = '',
  language = 'id',
  onIdeaChange,
  onLanguageChange,
  loading,
  loadingMessage,
  error,
  onStart,
}) {
  const [touched, setTouched] = useState(false)
  const textareaRef = useRef(null)

  const issue = validateIdea(idea)
  const showIssue = touched && issue && !loading

  // Auto-grow seperti ChatInput: ikuti isi, maks 160px.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [idea])

  const handleStart = () => {
    if (issue) {
      setTouched(true)
      return
    }
    onStart({ idea: idea.trim(), language })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleStart()
    }
  }

  const charCount = idea.length
  const nearLimit = charCount > MAX_CHARS - 400

  return (
    <div className="w-full">
      <div className="relative flex items-end gap-2 py-0.5 pl-8 pr-0.5">
        <span aria-hidden="true" className="tui-prompt pointer-events-none absolute left-3 top-1 select-none text-sm">›</span>
        <Textarea
          ref={textareaRef}
          value={idea}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) onIdeaChange(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTouched(true)}
          placeholder="Contoh: aplikasi absensi mahasiswa dengan QR Code"
          disabled={loading}
          className="max-h-40 min-h-[24px] flex-1 resize-none overflow-y-auto border-0 bg-transparent py-0.5 text-sm leading-relaxed text-foreground placeholder:text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
        />
        {nearLimit && (
          <span className={`shrink-0 text-[10px] tabular-nums ${charCount > MAX_CHARS - 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {charCount}/{MAX_CHARS}
          </span>
        )}
        <Button
          onClick={handleStart}
          disabled={!!issue || loading}
          size="icon"
          className="h-6 w-6 flex-shrink-0 rounded-sm"
          aria-label="Mulai buat PRD"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUp className="h-3 w-3" />}
        </Button>
      </div>

      <div className="mt-1 flex items-center justify-between gap-3 px-1">
        <div className="relative">
          <select
            id="prd-language"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            disabled={loading}
            aria-label="Bahasa PRD"
            className="inline-flex h-7 appearance-none items-center rounded-sm border border-border bg-background pl-2.5 pr-7 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="truncate text-[11px] text-muted-foreground/70">
          Enter untuk mulai · Shift+Enter baris baru
        </p>
      </div>

      {loading && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground" role="status">
          <Loader2 className="h-3 w-3 animate-spin" />
          {loadingMessage || 'Memproses ide…'}
        </p>
      )}

      {showIssue && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {issue}
        </p>
      )}

      {error && !loading && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
