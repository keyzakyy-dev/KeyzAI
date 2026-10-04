import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'

const ASK = 'Aku mau mulai bisnis. Bantu aku mulai dari mana?'
const QUESTION = 'Mau mulai dari bentuk yang mana?'
const OPTIONS = [
  ['Jualan barang', 'Stok, pengiriman, dan harga.'],
  ['Jasa', 'Waktu, klien, dan cara ditagih.'],
  ['Produk digital', 'Sekali dibuat, dijual berulang.'],
]
const PICK = 2
const REPLY = 'Mulai dari satu masalah yang sering orang bayar untuk diselesaikan. Tulis siapa pembelinya, lalu buat versi paling kecil yang bisa kamu jual minggu ini.'

// Minta, kartu muncul, satu opsi dipilih, jawaban mengalir, tahan.
const LOOP = 16000
const ASK_END = 1800
const CARD = 2600
const PICK_AT = 5200
const REPLY_START = 6400
const REPLY_END = 9800
const FINAL = 11000

function progress(t, from, to) {
  return Math.min(1, Math.max(0, (t - from) / (to - from)))
}

function frameAt(t) {
  const askLen = Math.round(progress(t, 200, ASK_END) * ASK.length)
  const asked = askLen === ASK.length
  const card = asked && t >= CARD
  const picked = card && t >= PICK_AT
  const words = REPLY.split(' ')
  const n = picked ? Math.round(progress(t, REPLY_START, REPLY_END) * words.length) : 0
  return {
    ask: ASK.slice(0, askLen),
    typing: askLen > 0 && askLen < ASK.length,
    card,
    picked,
    reply: words.slice(0, n).join(' '),
    done: n === words.length,
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
  const { ask, typing, card, picked, reply, done } = frameAt(useClock(root))

  return (
    <div
      ref={root}
      role="img"
      aria-label="Permintaan mulai bisnis dijawab dengan kartu pilihan. Setelah Produk digital dipilih, jawabannya muncul."
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="flex h-11 items-center border-b border-border px-4">
        <p className="truncate text-sm font-medium text-foreground">Mulai bisnis</p>
      </div>

      <div aria-hidden="true" className="min-h-[22rem] space-y-4 px-4 py-4">
        <div className="flex justify-end">
          <p className="max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-secondary px-4 py-2 text-sm leading-relaxed text-secondary-foreground">
            {ask}
            {typing && <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-secondary-foreground align-[-2px]" />}
          </p>
        </div>

        {card && (
          <div className="overflow-hidden rounded-xl border border-border">
            <p className="border-b border-border bg-muted/40 px-3 py-2.5 text-sm font-semibold leading-snug text-foreground">
              {QUESTION}
            </p>
            <div className="divide-y divide-border">
              {OPTIONS.map(([label, description], i) => {
                const selected = picked && i === PICK
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-3 px-3 py-2 text-left text-sm ${
                      selected ? 'bg-accent/40 text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border bg-background text-[11px] font-medium">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block">{label}</span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground/80">{description}</span>
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0" />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {reply && (
          <p className="font-serif text-sm leading-relaxed text-foreground">
            {reply}
            {!done && <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-muted-foreground align-[-2px]" />}
          </p>
        )}
      </div>
    </div>
  )
}
