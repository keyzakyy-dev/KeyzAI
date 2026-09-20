import { PRD_STEPS, STEP_LABELS } from '../../state/prd-model'

/**
 * Stepper horizontal tahapan PRD Builder. Destop: label penuh; mobile:
 * ringkas jadi "Langkah X dari N" + progress bar — mengikuti pola responsif
 * KeyzAI (bukan breakpoint baru, pakai utilitas Tailwind yang sudah ada).
 */
export function Stepper({ stepIndex, disabled = false, onJump }) {
  const total = PRD_STEPS.length
  const pct = Math.round(((stepIndex + 1) / total) * 100)

  return (
    <div className="w-full">
      {/* Mobile: ringkas */}
      <div className="flex items-center justify-between md:hidden">
        <p className="text-sm font-medium text-foreground">
          Langkah {stepIndex + 1} dari {total}
        </p>
        <p className="text-xs text-muted-foreground">{STEP_LABELS[PRD_STEPS[stepIndex]]}</p>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted md:hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      {/* Desktop: label penuh */}
      <ol className="hidden items-center gap-1 md:flex">
        {PRD_STEPS.map((s, i) => {
          const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'todo'
          const clickable = i <= stepIndex && !disabled
          return (
            <li key={s} className="flex flex-1 items-center">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJump?.(i)}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                  state === 'active'
                    ? 'bg-accent/70 text-foreground'
                    : state === 'done'
                      ? 'text-foreground hover:bg-accent/40'
                      : 'text-muted-foreground/60'
                } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-[11px] font-medium tabular-nums ${
                    state === 'active'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : state === 'done'
                        ? 'border-primary/50 text-primary'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {state === 'done' ? '✓' : i + 1}
                </span>
                <span className="truncate">{STEP_LABELS[s]}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
