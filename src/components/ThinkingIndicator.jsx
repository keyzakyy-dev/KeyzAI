import { useEffect, useState } from 'react'

/**
 * Sel "thinking" ala TUI: panel berborder + inset title, tiga kotak piksel
 * berdenyut, kata status, dan counter waktu nyata.
 *
 * Presentasional: TIDAK punya timer internal kalau `elapsedMs` diberikan,
 * sehingga mockup hero bisa mengendalikannya sendiri lewat loop ketiknya.
 * Tanpa `elapsedMs`, komponen menjalankan timer adaptif (100ms sampai 10
 * detik, lalu 200ms) — cukup halus tapi hemat render.
 *
 * Kata status mengikuti fase + ambang waktu, bukan siklus acak. Model yang
 * berpikir 5 menit akan tetap menampilkan waktu yang jujur, bukan kata yang
 * berputar-putar.
 */
const WAIT_MS = 1500
const LONG_MS = 8000

export function thinkingWord(reasoning, ms) {
  if (reasoning) return 'model berpikir'
  if (ms < WAIT_MS) return 'menunggu model'
  return ms >= LONG_MS ? 'model masih berpikir' : 'model berpikir'
}

export function formatElapsed(ms) {
  const s = Math.max(0, ms) / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

function useAdaptiveElapsed(enabled) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!enabled) return undefined
    const t0 = Date.now()
    let timer
    // setTimeout rekursif (bukan setInterval) supaya jeda bisa berubah
    // menurut waktu yang sudah berjalan.
    const schedule = () => {
      const e = Date.now() - t0
      timer = setTimeout(() => {
        setElapsed(Date.now() - t0)
        schedule()
      }, e < 10000 ? 100 : 200)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [enabled])
  return elapsed
}

export function ThinkingIndicator({ reasoning = false, elapsedMs = null, className = '' }) {
  const driven = elapsedMs !== null && elapsedMs !== undefined
  const own = useAdaptiveElapsed(!driven)
  const ms = driven ? elapsedMs : own
  const word = thinkingWord(reasoning, ms)

  return (
    <div className={`tui-panel flex items-center gap-2 px-3 py-1.5 font-mono text-[13px] ${className}`} role="status" aria-live="polite">
      <span className="tui-inset-title tui-inset-accent" aria-hidden="true">thinking</span>
      <span className="inline-flex shrink-0 items-center gap-1" aria-hidden="true">
        <span className="tui-box-loading inline-block h-1.5 w-1.5 bg-red-500" />
        <span className="tui-box-loading inline-block h-1.5 w-1.5 bg-red-500" style={{ animationDelay: '0.15s' }} />
        <span className="tui-box-loading inline-block h-1.5 w-1.5 bg-red-500" style={{ animationDelay: '0.3s' }} />
      </span>
      <span className="min-w-0 flex-1 truncate text-foreground thinking-fade">{word}</span>
      {/* Counter disembunyikan dari screen reader: berubah 5-10x per detik,
          di announces lewat aria-live akan membosankan. */}
      <span className="shrink-0 tabular-nums text-muted-foreground" aria-hidden="true">
        {formatElapsed(ms)}
      </span>
    </div>
  )
}