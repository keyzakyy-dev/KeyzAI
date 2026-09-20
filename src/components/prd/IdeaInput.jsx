import { useState } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'

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
      <div className="space-y-3">
        <h1 className="text-center font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Mau bikin apa?
        </h1>
        <p className="text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          Ceritakan ide produk atau aplikasi yang ingin kamu buat.
        </p>
      </div>

      <div className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <Textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={'Contoh:\nSaya ingin membuat aplikasi absensi mahasiswa menggunakan QR Code yang digunakan oleh mahasiswa, dosen, dan admin.'}
          disabled={loading}
          className="min-h-[140px] resize-y text-base sm:text-[15px]"
          maxLength={4000}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label htmlFor="prd-language" className="text-xs text-muted-foreground">
              Bahasa
            </label>
            <select
              id="prd-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
          <p className="text-[11px] tabular-nums text-muted-foreground/70 sm:mr-1">
            {idea.length}/4000
          </p>
        </div>

        {!loading && idea.length === 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground/70">Atau mulai dari contoh:</p>
            <div className="flex flex-col gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setIdea(ex)}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  <Sparkles className="h-3 w-3 flex-shrink-0 text-primary/70" />
                  <span className="min-w-0 truncate">{ex}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showIssue && (
          <p className="text-xs text-destructive" role="alert">
            {issue}
          </p>
        )}

        {loading && (
          <div className="mt-6 space-y-3" aria-busy="true" aria-live="polite">
            <div className="h-3 w-48 animate-pulse rounded-full bg-muted" />
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
            <div className="h-16 w-3/4 animate-pulse rounded-xl bg-muted" />
            <p className="text-center text-xs text-muted-foreground">{loadingMessage || 'Memproses ide…'}</p>
          </div>
        )}

        <Button onClick={handleStart} disabled={!!issue || loading} className="w-full gap-2" size="lg">
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

      <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground/70">
        Semakin jelas ide kamu, semakin sedikit pertanyaan yang AI tanyakan.
      </p>
    </div>
  )
}
