import { Check } from 'lucide-react'

import { PRD_STEPS, STEP_LABELS } from '../../state/prd-model'

/**
 * Progress ala draf dokumen: nomor serif 01..05 dengan segmen garis tipis.
 * Langkah yang sudah lewat bisa diklik untuk kembali. Mobile: hitungan + bar.
 */
export function Stepper({ stepIndex, disabled = false, onJump }) {
  const total = PRD_STEPS.length
  const pct = Math.round(((stepIndex + 1) / total) * 100)

  return (
    <div className="w-full">
      <ol className="hidden items-stretch gap-4 md:flex">
        {PRD_STEPS.map((s, i) => {
          const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'todo'
          const clickable = i <= stepIndex && !disabled
          return (
            <li key={s} className="min-w-0 flex-1">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJump?.(i)}
                aria-current={state === 'active' ? 'step' : undefined}
                aria-label={`Langkah ${i + 1}: ${STEP_LABELS[s]}`}
                className={`group w-full ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className="flex items-center gap-1.5">
                  {state === 'done' ? (
                    <Check className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <span
                      className={`font-serif text-[13px] tabular-nums ${
                        state === 'active' ? 'text-foreground' : 'text-muted-foreground/40'
                      }`}
                    >
                      0{i + 1}
                    </span>
                  )}
                  <span
                    className={`hidden truncate text-[11px] font-medium sm:block ${
                      state === 'active'
                        ? 'text-foreground'
                        : state === 'done'
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/40 group-hover:text-muted-foreground'
                    }`}
                  >
                    {STEP_LABELS[s]}
                  </span>
                </span>
                <span
                  className={`mt-1.5 block h-px w-full transition-colors ${
                    state === 'active'
                      ? 'bg-primary'
                      : state === 'done'
                        ? 'bg-foreground/30'
                        : 'bg-border group-hover:bg-foreground/20'
                  }`}
                />
              </button>
            </li>
          )
        })}
      </ol>

      <div className="flex items-center justify-between md:hidden">
        <p className="text-sm text-foreground">
          <span className="font-serif tabular-nums">0{stepIndex + 1}</span>
          <span className="text-muted-foreground"> · {STEP_LABELS[PRD_STEPS[stepIndex]]}</span>
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {stepIndex + 1}/{total}
        </p>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted md:hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
