import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

// Mockup dekoratif halaman chat (gaya TUI) untuk hero landing.
// Murni pajangan: aria-hidden + tanpa interaksi. Animasi ketik loop
// meniru jawaban AI yang sedang mengalir.
const USER_TEXT = 'Jelaskan RAG untuk pemula'
const AI_TEXT =
  'RAG menggabungkan pencarian dokumen dengan LLM — jawabannya berdasar sumber, bukan hafalan model.'

const TYPE_MS = 26
const HOLD_MS = 2800

export function ChatMockup() {
  const [chars, setChars] = useState(0)
  const [working, setWorking] = useState(true)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setChars(AI_TEXT.length)
      setWorking(false)
      return
    }
    let i = 0
    let hold = null
    let timer = null
    const tick = () => {
      i += 1
      setChars(i)
      if (i >= AI_TEXT.length) {
        setWorking(false)
        hold = setTimeout(() => {
          i = 0
          setChars(0)
          setWorking(true)
          timer = setInterval(tick, TYPE_MS)
        }, HOLD_MS)
        return
      }
      if (i === 1) setWorking(true)
    }
    timer = setInterval(tick, TYPE_MS)
    return () => {
      clearInterval(timer)
      clearTimeout(hold)
    }
  }, [])

  const done = chars >= AI_TEXT.length

  return (
    <div aria-hidden="true" className="w-full max-w-[520px] select-none">
      <div className="overflow-hidden rounded-xl border border-foreground/15 bg-background/80 shadow-[0_24px_80px_-24px_hsl(var(--foreground)/0.25)] backdrop-blur-sm">
        {/* Top bar */}
        <div className="flex h-10 items-center justify-between gap-3 border-b border-foreground/10 px-4 text-xs">
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-semibold tracking-tight text-foreground">keyzai</span>
            <span className="select-none text-muted-foreground/50">·</span>
            <span className="truncate text-muted-foreground">tamu</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-sm border border-foreground/10 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <span className="truncate">Qwen 3.8 Flash</span>
            <span className="text-[10px] font-medium text-emerald-600/90 dark:text-emerald-400/90">
              Free
            </span>
          </div>
        </div>

        {/* Output */}
        <div className="relative px-4 pb-4 pt-5">
          <span className="tui-inset-title">output</span>
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-lg rounded-br-sm border border-foreground/10 bg-foreground/[0.04] px-3 py-2 text-left text-[13px] leading-relaxed text-foreground">
                {USER_TEXT}
              </p>
            </div>
            <div className="flex gap-2.5">
              <span className="tui-prompt mt-0.5 shrink-0 text-sm font-bold">›</span>
              <p className="min-h-[63px] min-w-0 flex-1 text-[13px] leading-relaxed text-foreground/90">
                {AI_TEXT.slice(0, chars)}
                {!done && (
                  <span className="ml-0.5 inline-block h-[14px] w-[7px] translate-y-[2px] animate-pulse bg-foreground/70" />
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-foreground/10 px-4 pb-3 pt-3">
          <div className="flex items-center gap-2">
            <span className="tui-prompt shrink-0 text-sm font-bold">›</span>
            <p className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground/60">
              Ada yang bisa dibantu?
            </p>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-foreground/25 text-foreground">
              <ArrowUp className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[11px]">
            <span
              className={`px-1 py-px text-[10px] font-bold uppercase tracking-wider ${
                working ? 'tui-badge-working' : 'tui-badge-idle'
              }`}
            >
              {working ? 'working' : 'idle'}
            </span>
            <span className="text-muted-foreground">2 msgs · ~1,2k tok</span>
            <span className="ml-auto hidden text-muted-foreground/60 sm:inline">
              Enter kirim
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
