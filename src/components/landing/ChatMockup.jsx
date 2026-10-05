import { useEffect, useRef, useState } from 'react'
import { Square, ChevronDown, Plus, FileText, Copy, MessageSquare, User } from 'lucide-react'
import { Markdown, closeOpenFence, insideFence } from '../../lib/markdown'
import { ThinkingIndicator } from '../ThinkingIndicator'
import { Wordmark } from '../../lib/logo-img'
import { KeyMark } from '../../lib/key-mark'

// Replika dekoratif halaman chat (/chat) untuk hero landing.
// Setia dengan ChatInterface + ChatMessage: chrome top bar, bubble user/AI
// berborder, panel SESSION + menu/recent/account, dan status bar.
//
// Jawaban AI memakai markdown sungguhan yang diketik bertahap, sehingga
// mockup memakai renderer yang sama dengan chat asli (bukan teks polos):
// heading, bold, list, blockquote, dan code block ikut ter-render apa adanya
// termasuk perbaikan hierarki h1-h4.
//
// Murni pajangan: aria-hidden + tanpa interaksi.
const USER_TEXT = 'Jelaskan RAG untuk pemula'
const AI_TEXT = [
  '## RAG untuk pemula',
  '',
  '**RAG** menggabungkan pencarian dokumen dengan LLM — jawabannya',
  'berdasar sumber, bukan hafalan model.',
  '',
  '1. Pecah dokumen jadi potongan kecil',
  '2. Simpan embedding ke basis vektor',
  '3. Ambil potongan yang paling mirip',
  '4. Masukkan sebagai konteks ke prompt',
  '',
  '> Tanpa sumber yang stole, jawaban bisa halusinasi.',
  '',
  '```js',
  'const hits = await search(query, 5)',
  'return llm.complete({ context: hits })',
  '```',
].join('\n')
const MODEL_LABEL = 'Qwen 3.8 Flash'

const CHARS_PER_TICK = 3
const TICK_MS = 32
const THINK_MS = 1400
const HOLD_MS = 3400

// Jitter ringan supaya ritme ketik tidak terasa seperti mesin.
const jitter = () => TICK_MS * (0.85 + Math.random() * 0.3)

export function ChatMockup() {
  const [chars, setChars] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [tab, setTab] = useState('menu')
  const t0 = useRef(0)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setChars(AI_TEXT.length)
      setElapsed(4200)
      return undefined
    }
    let timer = null
    let hold = null

    // Satu jam untuk counter (adaptive: 100ms lalu 200ms) yang hidup sepanjang
    // siklus, terpisah dari interval ketik supaya ritme dua-duanya stabil.
    // Counter lewat timeout rekursif supaya jeda bisa naik ke 200ms setelah
    // 10 detik, sama seperti ThinkingIndicator di chat sungguhan.
    let clock = null
    const tickClock = () => {
      const e = Date.now() - t0.current
      clock = setTimeout(() => {
        setElapsed(Date.now() - t0.current)
        tickClock()
      }, e < 10000 ? 100 : 200)
    }

    const beginCycle = () => {
      t0.current = Date.now()
      setChars(0)
      setElapsed(0)
      let i = 0
      timer = setInterval(() => {
        i = Math.min(AI_TEXT.length, i + CHARS_PER_TICK)
        setChars(i)
        if (i >= AI_TEXT.length) {
          clearInterval(timer)
          timer = null
          hold = setTimeout(beginCycle, HOLD_MS)
        }
      }, jitter())
    }

    // Fase "thinking" dulu: sel TUI + counter, lalu jawaban mulai mengalir.
    t0.current = Date.now()
    tickClock()
    hold = setTimeout(beginCycle, THINK_MS)

    return () => {
      clearInterval(timer)
      clearTimeout(hold)
      clearTimeout(clock)
    }
  }, [])

  const thinking = chars === 0
  const done = chars >= AI_TEXT.length
  const tok = Math.round((USER_TEXT.length + chars) / 4)
  const ctxFilled = Math.min(28, Math.round((tok / 256000) * 28))

  // Parser markdown butuh teks utuh; fence yang belum ditutup ditutup dulu
  // supaya blok kode parsial tidak bocor mentah. Caret disisipkan sebagai
  // karakter biasa, tapi hanya di luar fence (di dalam pre akan terlihat aneh).
  let partial = AI_TEXT.slice(0, chars)
  if (!done && !insideFence(partial)) partial += ' ▌'

  return (
    <div
      aria-hidden="true"
      className="tui-root chat-mockup w-full max-w-[640px] select-none text-foreground"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_168px] grid-rows-[minmax(0,1fr)_auto] gap-2">
        {/* Kolom utama */}
        <main className="flex min-h-0 min-w-0 flex-col gap-3">
          {/* Top bar */}
          <div className="tui-panel relative z-20 flex h-10 flex-shrink-0 items-center justify-between gap-3 px-4 text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <Wordmark className="shrink-0 text-[13px]" />
              <span className="shrink-0 select-none text-muted-foreground/50">·</span>
              <span className="shrink-0 text-muted-foreground">tamu</span>
              <span className="shrink-0 select-none text-muted-foreground/50">·</span>
              <span className="min-w-0 truncate text-muted-foreground">RAG untuk pemula</span>
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="tui-tab-active px-1.5 py-0.5 font-semibold">masuk</span>
              <span className="select-none text-muted-foreground/40" aria-hidden="true">·</span>
              <span className="text-muted-foreground">Settings</span>
              <span className="flex h-6 w-6 items-center justify-center border border-foreground/15 text-muted-foreground">
                <Plus className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Output — tinggi tetap supaya mockup tidak bergeser selama siklus
              animasi (thinking -> mengetik -> selesai). Hanya max_h akan
              membiarkan tinggi ikut isi, jadi layout hero ikut bergoyang.
              Isi di dalam scroll (sama chat asli), bukan dipotong: blok kode
              yang exceed tetap bisa dibaca. */}
          <div className="tui-panel relative flex h-[300px] min-h-0 flex-1 flex-col lg:h-[320px]">
            <span className="tui-inset-title" aria-hidden="true">output</span>
            <div className="mockup-scroll flex flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain px-4 py-3">
              {/* Bubble user: kanan, garis kuning di tepi kanan (sama ChatMessage) */}
              <div className="flex justify-end">
                <div className="w-fit max-w-[90%] border-r-2 border-yellow-400 bg-foreground/[0.04] px-3 py-1">
                  <p className="whitespace-pre-wrap break-words font-mono text-[12px] font-semibold text-foreground">
                    {USER_TEXT}
                  </p>
                </div>
              </div>

              {/* Bubble AI: box penuh + markdown streaming */}
              <div className="min-w-0">
                {thinking ? (
                  <ThinkingIndicator reasoning elapsedMs={elapsed} />
                ) : (
                  <>
                    <div className="border border-foreground/15 px-3 py-2">
                      <Markdown
                        text={closeOpenFence(partial)}
                        streaming={!done}
                        className="font-mono text-[12px] leading-relaxed"
                      />
                    </div>
                    {!done ? null : (
                      <div className="flex items-center gap-1 pt-1">
                        <span className="text-[10px] text-muted-foreground">
                          09:41 · {AI_TEXT.trim().split(/\s+/).length} kata · 4s
                        </span>
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="tui-panel tui-queued relative flex-shrink-0 px-3 py-2">
            <span className="tui-inset-title tui-inset-accent" aria-hidden="true">queued</span>
            <div className="relative">
              <div className="flex items-end gap-2 py-0.5 pl-7 pr-0.5">
                <p className="min-h-[18px] flex-1 text-[12px] leading-relaxed text-muted-foreground/60">
                  Ada yang bisa dibantu?
                </p>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-destructive/60 text-destructive">
                  <Square className="h-2 w-2 fill-current" />
                </span>
              </div>
              <span className="tui-prompt pointer-events-none absolute left-2.5 top-0 select-none text-[12px]" aria-hidden="true">
                ›
              </span>
            </div>
          </div>
        </main>

        {/* Panel kanan */}
        <aside className="col-start-2 row-start-1 flex min-h-0 min-w-0 flex-col gap-3">
          <section className="tui-panel relative shrink-0 px-4 pb-5 pt-6 text-xs leading-relaxed">
            <span className="tui-inset-title" aria-hidden="true">session</span>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[10px]">
              <dt className="text-muted-foreground">context</dt>
              <dd className="truncate text-right">
                <span className="tui-accent font-bold">~0%</span>{' '}
                <span className="text-muted-foreground/40">
                  {'▓'.repeat(ctxFilled)}
                  {'░'.repeat(28 - ctxFilled)}
                </span>
              </dd>
              <dt className="text-muted-foreground">tokens</dt>
              <dd className="text-right text-foreground">~{tok.toLocaleString('en-US')} / 256,000</dd>
              <dt className="text-muted-foreground">used</dt>
              <dd className="text-right text-foreground">in 1 · out 1</dd>
              <dt className="text-muted-foreground">cost</dt>
              <dd className="text-right text-foreground">$0.0000</dd>
              <dt className="text-muted-foreground">tools</dt>
              <dd className="text-right text-foreground">0 calls</dd>
              <dt className="text-muted-foreground">chats</dt>
              <dd className="text-right text-foreground">3</dd>
              <dt className="text-muted-foreground">status</dt>
              <dd className="text-right text-foreground">{done ? 'idle' : 'working'}</dd>
              <dt className="text-muted-foreground">messages</dt>
              <dd className="text-right text-foreground">2</dd>
            </dl>
          </section>

          <section className="tui-panel relative flex min-h-0 flex-1 flex-col px-4 pb-5 pt-6 text-xs leading-relaxed">
            <nav className="tui-inset-title">
              {['menu', 'recent', 'account'].map((k, idx) => (
                <span key={k}>
                  {idx > 0 && <span> · </span>}
                  <button
                    type="button"
                    onClick={() => setTab(k)}
                    className={tab === k ? 'tui-accent font-bold' : ''}
                  >
                    {k}
                  </button>
                </span>
              ))}
            </nav>
            <div className="border-b border-foreground/10 pb-4">
              <p className="text-[10px] text-muted-foreground">
                {done ? 'idle · siap menerima perintah' : 'menunggu model…'}
              </p>
              <p className="mt-1 text-[10px] text-foreground">
                KeyzAI <span className="tui-accent font-semibold">›{MODEL_LABEL}</span>
              </p>
            </div>
            <div className="min-h-0 pt-4 text-[10px]">
              {tab === 'menu' && (
                <div>
                  <p className="font-bold uppercase tracking-wider text-muted-foreground">menu</p>
                  <div className="mt-1 space-y-0.5">
                    <p className="flex items-center gap-2 px-1 py-1 text-foreground/80">
                      <Plus className="h-3 w-3 shrink-0 opacity-40" /> Chat baru
                    </p>
                    <p className="flex items-center gap-2 px-1 py-1 text-foreground/80">
                      <FileText className="h-3 w-3 shrink-0 opacity-40" /> PRD Builder{' '}
                      <span className="text-muted-foreground/60">[Beta]</span>
                    </p>
                  </div>
                </div>
              )}
              {tab === 'recent' && (
                <div>
                  <p className="font-bold uppercase tracking-wider text-muted-foreground">recent</p>
                  <ul className="mt-1 space-y-0.5">
                    {['RAG untuk pemula', 'Optimasi prompt', 'Deploy worker'].map((t, i) => (
                      <li key={t} className={`tui-row-active flex items-center gap-2 px-1 py-1 text-foreground/80 ${i === 0 ? '' : 'opacity-70'}`}>
                        <MessageSquare className="h-3 w-3 shrink-0 opacity-40" />
                        <span className="min-w-0 flex-1 truncate">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tab === 'account' && (
                <div>
                  <p className="font-bold uppercase tracking-wider text-muted-foreground">account</p>
                  <div className="mt-1 flex items-center gap-2 px-1 py-1">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-dashed border-foreground/25 text-muted-foreground">
                      <User className="h-3 w-3" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-foreground">Masuk</span>
                      <span className="block text-muted-foreground/70">Riwayat belum tersimpan</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground/60" aria-hidden="true">›</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </aside>

        {/* Status bar */}
        <div className="relative col-span-2 flex flex-col gap-1 px-1 text-[10px] leading-relaxed">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-px">
            <span className="inline-flex items-center gap-1" aria-hidden="true">
              <span className={`tui-box-loading inline-block h-1.5 w-1.5 ${done ? 'bg-foreground/25' : 'bg-yellow-400'}`} />
              <span className={`tui-box-loading inline-block h-1.5 w-1.5 ${done ? 'bg-foreground/25' : 'bg-yellow-400'}`} style={done ? undefined : { animationDelay: '0.15s' }} />
              <span className={`tui-box-loading inline-block h-1.5 w-1.5 ${done ? 'bg-foreground/25' : 'bg-yellow-400'}`} style={done ? undefined : { animationDelay: '0.3s' }} />
            </span>
            <span>
              {done ? (
                <span className="text-muted-foreground">siap · Enter untuk kirim · Shift+Enter baris baru</span>
              ) : (
                <>
                  <span className="text-foreground">Waiting for the model</span>
                  <span className="text-muted-foreground"> · Esc to stop</span>
                </>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-px">
            <span className={`px-1 py-px text-[9px] font-bold uppercase tracking-wider ${done ? 'tui-badge-idle' : 'tui-badge-working'}`}>
              {done ? 'idle' : 'working'}
            </span>
            <span className="tui-accent font-semibold">keyzai</span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex h-5 shrink-0 items-center gap-1 border border-foreground/10 px-1.5 font-medium text-muted-foreground">
              <KeyMark className="h-2.5 w-2.5" />
              <span className="max-w-24 truncate">{MODEL_LABEL}</span>
              <span className="text-[9px] font-medium text-yellow-700 dark:text-yellow-400/90">Free</span>
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