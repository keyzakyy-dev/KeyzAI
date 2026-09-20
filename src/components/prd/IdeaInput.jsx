import { useState } from 'react'
import { Sparkles, ArrowRight, Wand2 } from 'lucide-react'

import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { validateIdea } from '../../state/prd-model'

const EXAMPLES = [
  'Aplikasi absensi mahasiswa dengan QR Code untuk mahasiswa, dosen, dan admin.',
  'Marketplace makanan sehat yang menghubungkan pelanggan dengan dapur lokal.',
  'Aplikasi manajemen keuangan UMKM dengan laporan bulanan otomatis.',
]

/**
 * STEP 1 — Input ide. User bebas menjelaskan (satu kalimat sampai detail);
 * bahasa default Indonesia. Tombol Mulai disabled sampai ide valid.
 */
export function IdeaInput({ initialIdea = '', initialLanguage = 'id', loading, loadingMessage, onStart, error }) {
  const [idea, setIdea] = useState(initialIdea)
  const [language, setLanguage] = useState(initialLanguage)
  const [touched, setTouched] = useState(false)

  const issue = validateIdea(idea)
  const showIssue = touched && issue && !loading

  const handleStart = () => {
    if (issue) {
      setTouched(true)
      return
    }
    onStart({ idea: idea.trim(), language })
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="space-y-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <Wand2 className="h-3 w-3" />
          PRD Builder
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Mau bikin apa?
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Ceritakan ide produk atau aplikasi yang ingin kamu buat. AI akan menerjemahkannya menjadi PRD lengkap.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <Textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={'Contoh:\nSaya ingin membuat aplikasi absensi mahasiswa menggunakan QR Code yang digunakan oleh mahasiswa, dosen, dan admin.'}
          disabled={loading}
          className="min-h-[140px] resize-y border-0 bg-transparent p-1 text-base shadow-none focus-visible:ring-0 sm:text-[15px]"
          maxLength={4000}
        />

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <label htmlFor="prd-language" className="text-xs text-muted-foreground">
              Bahasa
            </label>
            <select
              id="prd-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
              className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
          <p className="text-[11px] tabular-nums text-muted-foreground/70">
            {idea.length}/4000
          </p>
        </div>

        {showIssue && (
          <p className="mt-3 text-xs text-destructive" role="alert">
            {issue}
          </p>
        )}

        {loading && (
          <div className="mt-4 space-y-3 rounded-xl bg-muted/30 p-4" aria-busy="true" aria-live="polite">
            <div className="h-3 w-48 animate-pulse rounded-full bg-muted" />
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
            <div className="h-16 w-3/4 animate-pulse rounded-xl bg-muted" />
            <p className="text-center text-xs text-muted-foreground">{loadingMessage || 'Memproses ide…'}</p>
          </div>
        )}

        <Button onClick={handleStart} disabled={!!issue || loading} className="mt-4 w-full gap-2" size="lg">
          {loading ? (
            'Menganalisis…'
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Mulai
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="mt-4 text-center text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {!loading && idea.length === 0 && (
        <div className="mt-6">
          <p className="mb-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Atau mulai dari contoh
          </p>
          <div className="flex flex-col gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setIdea(ex)}
                className="group flex items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 py-2.5 text-left text-xs transition-all hover:border-foreground/30 hover:bg-accent/30 sm:text-[13px]"
              >
                <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-primary/70 transition-colors group-hover:text-primary" />
                <span className="min-w-0 flex-1 text-muted-foreground transition-colors group-hover:text-foreground">{ex}</span>
                <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/0 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
