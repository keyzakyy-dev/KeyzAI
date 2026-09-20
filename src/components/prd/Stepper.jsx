import { Check } from 'lucide-react'

import { PRD_STEPS, STEP_LABELS } from '../../state/prd-model'

/**
 * Stepper minimalis: deretan pill berlabel, state jelas (done/active/todo),
 * bisa diklik untuk kembali ke langkah sebelumnya. Mobile: bar tipis + hitungan.
 */
export function Stepper({ stepIndex, disabled = false, onJump }) {
  const total = PRD_STEPS.length
  const pct = Math.round(((stepIndex + 1) / total) * 100)

  return (
    <div className="w-full">
      <ol className="hidden items-center gap-1 md:flex">
        {PRD_STEPS.map((s, i) => {
          const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'todo'
          const clickable = i <= stepIndex && !disabled
          return (
            <li key={s} className="flex items-center">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJump?.(i)}
                className={`group flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3.5 text-sm transition-all ${
                  clickable ? 'cursor-pointer hover:bg-accent/50' : 'cursor-default'
                } ${state === 'active' ? 'bg-foreground text-background' : state === 'done' ? 'text-foreground' : 'text-muted-foreground/50'}`}
              >
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums transition-colors ${
                    state === 'active'
                      ? 'bg-background/20 text-background'
                      : state === 'done'
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border text-muted-foreground'
                  }`}
                >
                  {state === 'done' ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="font-medium">{STEP_LABELS[s]}</span>
              </button>
              {i < total - 1 && <span className="mx-0.5 h-px w-4 bg-border" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>

      <div className="flex items-center justify-between md:hidden">
        <p className="text-sm font-medium text-foreground">
          Langkah {stepIndex + 1} dari {total}
        </p>
        <p className="text-xs text-muted-foreground">{STEP_LABELS[PRD_STEPS[stepIndex]]}</p>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted md:hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
