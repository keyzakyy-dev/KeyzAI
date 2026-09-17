import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, Pencil1Icon, Cross2Icon } from '@radix-ui/react-icons'

import { Button } from './ui/button'
import { formatAnswers, SKIP_LABEL } from '../lib/options'

// ChatInterface menyuplai handler + pesan mana yang masih boleh dijawab.
// Kartu membaca context langsung (bukan lewat props) supaya elemen markdown yang
// sudah di-memo tidak menyimpan handler/status yang basi.
export const OptionsContext = createContext(null)

const ROW = 'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors'
const NAV_BTN =
  'rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent'

/** Skeleton saat blok opsi masih ter-stream (fence belum lengkap / JSON belum utuh). */
export function OptionsPending() {
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-border p-3" aria-hidden="true">
      <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted-foreground/20" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded-lg bg-muted/60"
          style={{ animationDelay: `${i * 90}ms` }}
        />
      ))}
    </div>
  )
}

export function OptionCard({ payload, messageId }) {
  const ctx = useContext(OptionsContext)
  const [page, setPage] = useState(0)
  const [answers, setAnswers] = useState({})
  const [picks, setPicks] = useState({})
  const [otherFor, setOtherFor] = useState(null)
  const [draft, setDraft] = useState('')
  const [done, setDone] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const inputRef = useRef(null)

  const questions = payload?.questions || []
  const total = questions.length
  const index = Math.min(page, Math.max(0, total - 1))
  const current = questions[index]
  const active = !!ctx && ctx.activeId === messageId && !ctx.loading && !done

  useEffect(() => {
    if (otherFor) inputRef.current?.focus()
  }, [otherFor])

  if (dismissed || !current) return null

  const multi = current.multiple === true
  const picked = picks[current.id] || []

  const submit = (next) => {
    const pairs = questions
      .map((q) => ({ id: q.id, question: q.question, label: next[q.id] }))
      .filter((p) => p.label)
    if (pairs.length === 0) return
    setDone(true)
    ctx?.onSelect?.(formatAnswers(pairs))
  }

  const commit = (label) => {
    if (!active || !label) return
    const next = { ...answers, [current.id]: label }
    setAnswers(next)
    setPicks((p) => ({ ...p, [current.id]: [] }))
    setOtherFor(null)
    setDraft('')
    if (questions.every((q) => next[q.id])) {
      submit(next)
      return
    }
    // lompat ke pertanyaan berikutnya yang belum dijawab
    const after = questions.findIndex((q, i) => i > index && !next[q.id])
    setPage(after === -1 ? questions.findIndex((q) => !next[q.id]) : after)
  }

  const toggleMulti = (label) => {
    if (!active) return
    setPicks((p) => {
      const list = p[current.id] || []
      return {
        ...p,
        [current.id]: list.includes(label) ? list.filter((l) => l !== label) : [...list, label],
      }
    })
  }

  const commitMulti = () => {
    if (picked.length > 0) commit(picked.join(', '))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/40 px-3 py-2.5">
        <p className="text-sm font-semibold leading-snug text-foreground">{current.question}</p>
        <div className="flex flex-shrink-0 items-center gap-0.5">
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => setPage(Math.max(0, index - 1))}
                disabled={index === 0}
                aria-label="Pertanyaan sebelumnya"
                className={NAV_BTN}
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>
              <span className="tabular-nums text-[11px] text-muted-foreground">
                {index + 1} dari {total}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(total - 1, index + 1))}
                disabled={index >= total - 1}
                aria-label="Pertanyaan berikutnya"
                className={NAV_BTN}
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Tutup pilihan"
            className={NAV_BTN}
          >
            <Cross2Icon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div role={multi ? 'group' : 'radiogroup'} aria-label={current.question} className="divide-y divide-border">
        {current.options.map((opt, i) => {
          const selected = multi ? picked.includes(opt.label) : answers[current.id] === opt.label
          return (
            <button
              key={opt.label}
              type="button"
              role={multi ? undefined : 'radio'}
              aria-checked={multi ? undefined : selected}
              aria-pressed={multi ? selected : undefined}
              disabled={!active}
              onClick={() => (multi ? toggleMulti(opt.label) : commit(opt.label))}
              className={`${ROW} ${active ? 'hover:bg-accent/60' : 'cursor-default opacity-60'} ${
                selected ? 'bg-accent/40 text-foreground' : 'text-muted-foreground'
              }`}
            >
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-border bg-background text-[11px] font-medium">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words">{opt.label}</span>
                {opt.description && (
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground/80">
                    {opt.description}
                  </span>
                )}
              </span>
              {selected && <CheckIcon className="h-4 w-4 flex-shrink-0" />}
            </button>
          )
        })}

        <div className="flex items-center gap-2 px-3 py-2">
          {otherFor === current.id ? (
            <form
              className="flex flex-1 items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const value = draft.trim()
                if (value) commit(value)
              }}
            >
              <Pencil1Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOtherFor(null)
                    setDraft('')
                  }
                }}
                disabled={!active}
                maxLength={300}
                placeholder="Tulis jawabanmu…"
                className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" size="sm" disabled={!active || !draft.trim()} className="h-8 rounded-md">
                Kirim
              </Button>
            </form>
          ) : (
            <>
              <button
                type="button"
                disabled={!active}
                onClick={() => setOtherFor(current.id)}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm transition-colors ${
                  active ? 'text-muted-foreground hover:text-foreground' : 'cursor-default text-muted-foreground/60'
                }`}
              >
                <Pencil1Icon className="h-3.5 w-3.5 flex-shrink-0" />
                Lainnya
              </button>
              {multi && picked.length > 0 && (
                <Button type="button" size="sm" onClick={commitMulti} className="h-8 rounded-md">
                  Kirim
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!active}
                onClick={() => commit(SKIP_LABEL)}
                className="h-8 rounded-md"
              >
                Lewati
              </Button>
            </>
          )}
        </div>
      </div>

      {done && (
        <p className="border-t border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          Jawaban terkirim
        </p>
      )}
    </div>
  )
}