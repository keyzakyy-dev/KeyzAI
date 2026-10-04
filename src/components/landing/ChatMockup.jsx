import { useEffect, useState } from 'react'
import { Square, ChevronDown, Plus, FileText } from 'lucide-react'
import { KeyMark } from '../../lib/key-mark'

// Replika dekoratif halaman chat (/chat) untuk hero landing.
// Setia dengan ChatInterface: kolom utama (top bar, output, input,
// status bar) + panel kanan (session, menu). Murni pajangan:
// aria-hidden + tanpa interaksi. Animasi ketik loop meniru jawaban
// AI yang sedang mengalir (state working).
const USER_TEXT = 'Jelaskan RAG untuk pemula'
const AI_TEXT =
  'RAG menggabungkan pencarian dokumen dengan LLM — jawabannya berdasar sumber, bukan hafalan model.'
const MODEL_LABEL = 'Qwen 3.8 Flash'

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
  const tok = Math.round((USER_TEXT.length + chars) / 4)
  const ctxFilled = Math.min(10, Math.round((tok / 256000) * 10))

  return (
    <div
      aria-hidden="true"
      className="tui-root chat-mockup w-full max-w-[640px] select-none text-[11px] leading-relaxed text-foreground"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_168px] grid-rows-[minmax(0,1fr)_auto] gap-2">
        {/* Kolom utama */}
        <main className="flex min-h-0 min-w-0 flex-col gap-2">
          {/* Top bar */}
          <div className="tui-panel flex h-8 flex-shrink-0 items-center justify-between gap-2 px-3 text-[11px]">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="shrink-0 font-semibold tracking-tight text-foreground">keyzai</span>
              <span className="shrink-0 select-none text-muted-foreground/50">·</span>
              <span className="shrink-0 text-muted-foreground">tamu</span>
              <span className="shrink-0 select-none text-muted-foreground/50">·</span>
              <span className="min-w-0 truncate text-muted-foreground">RAG untuk pemula</span>
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <span className="tui-tab-active px-1 py-px text-[10px] font-semibold">masuk</span>
              <span className="select-none text-muted-foreground/40">·</span>
              <span className="text-muted-foreground">Settings</span>
              <span className="flex h-5 w-5 items-center justify-center border border-foreground/15 text-muted-foreground">
                <Plus className="h-2.5 w-2.5" />
              </span>
            </div>
          </div>

          {/* Output */}
          <div className="tui-panel relative flex min-h-0 flex-1 flex-col">
            <span className="tui-inset-title">output</span>
            <div className="flex flex-1 flex-col gap-3 px-3 py-3">
              <div className="flex justify-start">
                <div className="w-full min-w-0">
                  <div className="flex gap-2 text-[12px] leading-relaxed">
                    <span className="tui-prompt select-none font-mono font-bold">›</span>
                    <div className="min-w-0 flex-1 text-foreground">
                      <p className="whitespace-pre-wrap break-words">{USER_TEXT}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="w-full min-w-0">
                  <div className="flex gap-2 text-[12px] leading-relaxed">
                    <span className="select-none font-mono text-muted-foreground">·</span>
                    <div className="min-w-0 flex-1 text-foreground">
                      <p className="whitespace-pre-wrap break-words">
                        {AI_TEXT.slice(0, chars)}
                        {!done && (
                          <span className="ml-0.5 inline-block h-[12px] w-[6px] translate-y-[2px] animate-pulse bg-foreground/70" />
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="tui-panel tui-queued relative flex-shrink-0 px-2 pb-1 pt-1.5">
            <span className="tui-inset-title tui-inset-accent">queued</span>
            <div className="w-full">
              <div className="relative">
                <div className="flex items-end gap-2 py-0.5 pl-7 pr-0.5">
                  <p className="min-h-[18px] flex-1 text-[12px] leading-relaxed text-muted-foreground/60">
                    Ada yang bisa dibantu?
                  </p>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-destructive/60 text-destructive">
                    <Square className="h-2 w-2 fill-current" />
                  </span>
                </div>
                <span className="tui-prompt pointer-events-none absolute left-2.5 top-1 select-none text-[12px]">
                  ›
                </span>
              </div>
              <div className="mt-1.5 text-[9px] leading-none text-muted-foreground/70">
                <span>KeyzAI bisa keliru. Cek kembali info penting.</span>
              </div>
            </div>
          </div>
        </main>

        {/* Panel kanan */}
        <aside className="col-start-2 row-start-1 flex min-h-0 min-w-0 flex-col gap-2">
          <section className="tui-panel relative shrink-0 px-3 pb-3 pt-5 text-[10px] leading-relaxed">
            <span className="tui-inset-title">session</span>
            <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-px">
              <dt className="text-muted-foreground">context</dt>
              <dd className="truncate text-right">
                <span className="tui-accent font-bold">~0%</span>{' '}
                <span className="text-muted-foreground/40">
                  {'▓'.repeat(ctxFilled)}
                  {'░'.repeat(10 - ctxFilled)}
                </span>
              </dd>
              <dt className="text-muted-foreground">tokens</dt>
              <dd className="text-right text-foreground">~{tok} / 256,000</dd>
              <dt className="text-muted-foreground">used</dt>
              <dd className="text-right text-foreground">in 1 · out 1</dd>
              <dt className="text-muted-foreground">cost</dt>
              <dd className="text-right text-foreground">$0.0000</dd>
              <dt className="text-muted-foreground">tools</dt>
              <dd className="text-right text-foreground">0 calls</dd>
              <dt className="text-muted-foreground">chats</dt>
              <dd className="text-right text-foreground">3</dd>
              <dt className="text-muted-foreground">status</dt>
              <dd className="text-right text-foreground">working</dd>
              <dt className="text-muted-foreground">messages</dt>
              <dd className="text-right text-foreground">2</dd>
            </dl>
          </section>

          <section className="tui-panel relative flex min-h-0 flex-1 flex-col px-3 pb-3 pt-5 text-[10px] leading-relaxed">
            <nav className="tui-inset-title">
              <span className="tui-accent font-bold">menu</span>
              <span> · </span>
              <span>recent</span>
              <span> · </span>
              <span>account</span>
            </nav>
            <div className="border-b border-foreground/10 pb-2">
              <p className="text-muted-foreground">menunggu model…</p>
              <p className="mt-0.5 truncate text-foreground">
                KeyzAI <span className="tui-accent font-semibold">›{MODEL_LABEL}</span>
              </p>
            </div>
            <div className="min-h-0 pt-2">
              <p className="font-bold uppercase tracking-wider text-muted-foreground">menu</p>
              <div className="mt-0.5">
                <p className="flex items-center gap-1.5 py-0.5 text-foreground/80">
                  <Plus className="h-2.5 w-2.5 shrink-0 opacity-40" /> Chat baru
                </p>
                <p className="flex items-center gap-1.5 py-0.5 text-foreground/80">
                  <FileText className="h-2.5 w-2.5 shrink-0 opacity-40" /> PRD Builder{' '}
                  <span className="text-muted-foreground/60">[Beta]</span>
                </p>
              </div>
            </div>
          </section>
        </aside>

        {/* Status bar */}
        <div className="relative col-span-2 flex flex-col gap-0.5 px-1 text-[10px] leading-relaxed">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-px">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 bg-orange-400" />
              <span className="inline-block h-1.5 w-1.5 bg-orange-400/60" />
              <span className="inline-block h-1.5 w-1.5 bg-foreground/25" />
            </span>
            <span>
              <span className="text-foreground">Waiting for the model</span>
              <span className="text-muted-foreground"> · Esc to stop</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-px">
            <span className="tui-badge-working px-1 py-px text-[9px] font-bold uppercase tracking-wider">
              working
            </span>
            <span className="tui-accent font-semibold">keyzai</span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-sm border border-foreground/10 px-1.5 text-[10px] font-medium text-muted-foreground">
              <KeyMark className="h-2.5 w-2.5" />
              <span className="max-w-24 truncate">{MODEL_LABEL}</span>
              <span className="text-[9px] font-medium text-emerald-600/90 dark:text-emerald-400/90">
                Free
              </span>
              <ChevronDown className="h-2.5 w-2.5" />
            </span>
            <span className="ml-auto shrink-0 tabular-nums text-muted-foreground/70">
              2 msgs · {tok} tok
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
