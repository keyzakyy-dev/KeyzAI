import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

const USER = 'Bikinin caption singkat buat foto kopi pagi'
const ANSWERS = [
  'Nikmatnya pagi, satu teguk sekaligus tenang.',
  'Pagi ini punya saya: kopi hitam, sunyi, dan ide yang belum ditulis.',
]

// Satu loop, fungsi dari t. Ketik, jawaban 1, buat ulang, jawaban 2, kembali ke 1.
const LOOP = 14500
const TYPE_END = 1400
const A1_END = 3200
const REGEN = 5200
const A2_END = 7400
const BACK = 10400
const FINAL = 11000

function progress(t, from, to) {
  return Math.min(1, Math.max(0, (t - from) / (to - from)))
}

function frameAt(t) {
  const userLen = Math.round(progress(t, 200, TYPE_END) * USER.length)
  const sent = userLen === USER.length
  const branch = sent && t >= REGEN && t < BACK ? 1 : 0
  const from = branch === 1 ? REGEN + 200 : TYPE_END + 200
  const to = branch === 1 ? A2_END : A1_END
  const words = ANSWERS[branch].split(' ')
  const n = sent ? Math.round(progress(t, from, to) * words.length) : 0
  return {
    user: USER.slice(0, userLen),
    typing: userLen > 0 && userLen < USER.length,
    answer: words.slice(0, n).join(' '),
    done: n === words.length,
    branch,
  }
}

function heldFrame() {
  const held = new URLSearchParams(window.location.search).get('t')
  return held !== null && !Number.isNaN(Number(held)) ? Number(held) : null
}

function useClock(target) {
  const [t, setT] = useState(() => {
    const held = heldFrame()
    if (held !== null) return held
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? FINAL : 0
  })
  useEffect(() => {
    if (heldFrame() !== null) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setT(FINAL)
      return
    }
    let on = true
    let elapsed = 0
    let last = performance.now()
    const seen = new IntersectionObserver(([e]) => {
      on = e.isIntersecting
    }, { threshold: 0.1 })
    if (target.current) seen.observe(target.current)
    const timer = window.setInterval(() => {
      const now = performance.now()
      if (on && document.visibilityState === 'visible') {
        elapsed = (elapsed + (now - last)) % LOOP
        setT(elapsed)
      }
      last = now
    }, 90)
    return () => {
      window.clearInterval(timer)
      seen.disconnect()
    }
  }, [target])
  return t
}

export function ChatMock() {
  const root = useRef(null)
  const { user, typing, answer, done, branch } = frameAt(useClock(root))

  return (
    <div
      ref={root}
      role="img"
      aria-label="Percakapan: caption foto kopi pagi, lalu dua jawaban yang bisa dibuka dengan panah."
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="flex h-11 items-center border-b border-border px-4">
        <p className="truncate text-sm font-medium text-foreground">Caption kopi pagi</p>
      </div>

      <div aria-hidden="true" className="space-y-5 px-4 py-5">
        <div className="flex justify-end">
          <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-secondary px-4 py-2 text-[15px] leading-relaxed text-secondary-foreground">
            {user}
            {typing && <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-secondary-foreground align-[-2px]" />}
          </p>
        </div>

        {user.length === USER.length && (
          <div className="space-y-1.5">
            <p className="min-h-[3.2em] font-serif text-[15px] leading-relaxed text-foreground">
              {answer}
              {answer && !done && <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-muted-foreground align-[-2px]" />}
            </p>
            {done && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-0.5">
                  <ChevronLeft className={`h-3.5 w-3.5 ${branch === 0 ? 'opacity-30' : ''}`} />
                  <span className="tabular-nums">{branch + 1} / 2</span>
                  <ChevronRight className={`h-3.5 w-3.5 ${branch === 1 ? 'opacity-30' : ''}`} />
                </span>
                <span className="inline-flex items-center gap-1 px-1">
                  <RotateCcw className="h-3 w-3" />
                  buat ulang
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
