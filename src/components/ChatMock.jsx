import { useEffect, useRef, useState } from 'react'
import { Check, Plus, Search, MessageSquare, ArrowUp, Sparkles } from 'lucide-react'

const ASK = 'Aku mau mulai bisnis. Bantu aku mulai dari mana?'
const QUESTION = 'Mau mulai dari bentuk yang mana?'
const OPTIONS = [
  ['Jualan barang', 'Stok, pengiriman, dan harga.'],
  ['Jasa', 'Waktu, klien, dan cara ditagih.'],
  ['Produk digital', 'Sekali dibuat, dijual berulang.'],
]
const PICK = 2
const REPLY = 'Mulai dari satu masalah yang sering orang bayar untuk diselesaikan. Tulis siapa pembelinya, lalu buat versi paling kecil yang bisa kamu jual minggu ini.'

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
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_32px_hsl(var(--foreground)/0.08),0_1px_3px_hsl(var(--foreground)/0.06)]"
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2.5">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f56] ring-1 ring-black/5" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e] ring-1 ring-black/5" />
          <span className="size-2.5 rounded-full bg-[#27c93f] ring-1 ring-black/5" />
        </span>
        <span className="mx-auto flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <Sparkles className="size-3 text-muted-foreground/70" aria-hidden="true" />
          keyz.ai/chat
        </span>
        <span className="hidden size-6 place-items-center rounded-md border border-border bg-background text-muted-foreground sm:grid">
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
        </span>
      </div>

      <div className="flex min-h-[24rem] sm:min-h-[25.5rem]">
        {/* sidebar, realistic app nav, hidden on very narrow hero to keep no overflow */}
        <div className="hidden w-[148px] shrink-0 flex-col border-r border-border bg-muted/25 sm:flex">
          <div className="flex flex-col gap-3 p-2.5">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-md bg-primary text-[10px] font-bold tracking-tight text-primary-foreground">K</span>
              <span className="text-xs font-semibold tracking-tight text-foreground">KeyzAI</span>
              <span className="ml-auto rounded bg-foreground px-1 py-px text-[8px] font-semibold uppercase tracking-wider text-background">Pro</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm">
              <Plus className="size-3.5" aria-hidden="true" />
              Chat baru
            </div>

            <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-[10px] text-muted-foreground">
              <Search className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">Cari percakapan</span>
            </div>

            <div className="space-y-2 pt-0.5">
              <p className="px-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/70">Hari ini</p>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 rounded-md bg-accent px-2 py-1.5 text-[11px] font-medium leading-none text-foreground">
                  <MessageSquare className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 truncate">Mulai bisnis</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] leading-none text-muted-foreground/60">
                  <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
                  <span className="truncate">Optimasi query 50rb</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] leading-none text-muted-foreground/60">
                  <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
                  <span className="truncate">Rapat klien besok</span>
                </div>
              </div>
              <p className="px-1 pt-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">Kemarin</p>
              <div className="px-2 py-1 text-[11px] leading-none text-muted-foreground/50 truncate">Regex validasi email</div>
            </div>
          </div>
          <div className="mt-auto border-t border-border/60 p-2.5">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-full bg-muted ring-1 ring-border" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-medium leading-none text-foreground">kamu@keyz.ai</span>
                <span className="block text-[10px] leading-none text-muted-foreground">Gratis · 12 chat</span>
              </span>
            </div>
          </div>
        </div>

        {/* main chat */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* chat header */}
          <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
            <p className="truncate text-xs font-medium text-foreground">Mulai bisnis</p>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-1 text-[10px] font-medium leading-none text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              GPT-4o
            </span>
          </div>

          {/* messages */}
          <div aria-hidden="true" className="flex flex-1 flex-col gap-3 bg-card px-3 py-3 sm:px-3.5">
            {/* user bubble */}
            <div className="flex justify-end">
              <p className="max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-primary px-3.5 py-2 text-[13px] leading-relaxed text-primary-foreground shadow-sm">
                {ask}
                {typing && <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-primary-foreground align-[-2px]" />}
              </p>
            </div>

            {/* option cards, appears after ask */}
            {card && (
              <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                <p className="border-b border-border bg-muted/30 px-3 py-2 text-xs font-semibold leading-snug text-foreground">{QUESTION}</p>
                <div className="divide-y divide-border">
                  {OPTIONS.map(([label, description], i) => {
                    const selected = picked && i === PICK
                    return (
                      <div
                        key={label}
                        className={`flex items-center gap-2.5 px-3 py-2 text-left ${selected ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}
                      >
                        <span
                          className={`grid size-6 shrink-0 place-items-center rounded-md border text-[11px] font-medium leading-none ${selected ? 'border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground' : 'border-border bg-muted/50 text-muted-foreground'}`}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-xs font-medium leading-none ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>{label}</span>
                          <span className={`mt-0.5 block text-[11px] leading-snug ${selected ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>{description}</span>
                        </span>
                        {selected && <Check className="size-4 shrink-0 text-primary-foreground" aria-hidden="true" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* assistant reply */}
            {reply ? (
              <div className="flex gap-2">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-border bg-muted text-[10px] font-bold text-muted-foreground" aria-hidden="true">
                  K
                </span>
                <p className="max-w-[92%] rounded-2xl rounded-tl-md border border-border bg-muted/40 px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground">
                  {reply}
                  {!done && <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-muted-foreground align-[-2px]" />}
                </p>
              </div>
            ) : card ? (
              <div className="flex items-center gap-1.5 pl-8 text-[11px] text-muted-foreground">
                <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/40" />
                <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                <span>KeyzAI mengetik…</span>
              </div>
            ) : null}
          </div>

          {/* composer */}
          <div className="border-t border-border bg-muted/20 p-2 sm:p-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-2 shadow-sm">
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground/60">Tanya lanjutan…</span>
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <ArrowUp className="size-3.5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-1.5 hidden text-center text-[9px] leading-none text-muted-foreground/60 sm:block">Enter kirim · Shift + Enter baris baru</p>
          </div>
        </div>
      </div>
    </div>
  )
}
