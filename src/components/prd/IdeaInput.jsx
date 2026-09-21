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
 * STEP 1 — Input ide: satu kartu, textarea auto-grow, Enter kirim, pilihan
 * bahasa + tombol kirim. Nomor serif di judul dan contoh adalah motif
 * dokumen yang sama dengan stepper.
 */
export function IdeaInput({ initialIdea = '', initialLanguage = 'id', loading, loadingMessage, onStart, error }) {
  const [idea, setIdea] = useState(initialIdea)
  const [language, setLanguage] = useState(initialLanguage)
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
    <div className="mx-auto w-full max-w-2xl">
      <div className="space-y-3 text-center">
        <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Mau bikin apa?
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
          Satu kalimat cukup. AI akan menanyakan sisanya sampai PRD-mu siap dipakai.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        <Textarea
          ref={textareaRef}
          value={idea}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) setIdea(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTouched(true)}
          placeholder="Contoh: aplikasi absensi mahasiswa dengan QR Code"
          disabled={loading}
          className="min-h-[52px] max-h-40 resize-none overflow-y-auto border-0 bg-transparent px-4 pt-3.5 pb-1 text-base text-foreground placeholder:font-serif placeholder:text-sm placeholder:text-muted-foreground/80 focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
        />

        <div className="flex items-center justify-between gap-3 px-3 pb-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="relative">
              <select
                id="prd-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={loading}
                aria-label="Bahasa PRD"
                className="inline-flex h-7 appearance-none items-center rounded-md border border-border bg-background pl-2.5 pr-7 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            </div>
            <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              {nearLimit && (
                <span className={`tabular-nums ${charCount > MAX_CHARS - 50 ? 'text-destructive' : ''}`}>
                  {charCount}/{MAX_CHARS}
                </span>
              )}
            </span>
          </div>

          <Button
            onClick={handleStart}
            disabled={!!issue || loading}
            size="icon"
            className="h-8 w-8 flex-shrink-0 rounded-lg"
            aria-label="Mulai buat PRD"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {loading && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground" role="status">
          <Loader2 className="h-3 w-3 animate-spin" />
          {loadingMessage || 'Memproses ide…'}
        </p>
      )}

      {showIssue && (
        <p className="mt-2 text-center text-xs text-destructive" role="alert">
          {issue}
        </p>
      )}

      {error && !loading && (
        <p className="mt-2 text-center text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {!loading && idea.length === 0 && (
        <div className="mt-6">
          <p className="mb-2.5 text-center text-xs text-muted-foreground">Atau mulai dari contoh:</p>
          <div className="flex flex-col gap-1.5">
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex}
                type="button"
                onClick={() => setIdea(ex)}
                className="group flex items-baseline gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5 text-left transition-colors hover:border-foreground/30 hover:bg-accent/30"
              >
                <span className="flex-shrink-0 font-serif text-[11px] tabular-nums text-muted-foreground/60 group-hover:text-foreground">
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
