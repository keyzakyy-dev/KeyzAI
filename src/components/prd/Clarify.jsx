import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react'

import { Button } from '../ui/button'
import { QuestionField } from './QuestionField'
import { StageError, StageLoading } from './StageLoading'
import { StepHeader } from './StepHeader'
import { normalizeAnswer } from '../../state/prd-model'

/**
 * STEP 2 — Klarifikasi dinamis. Jumlah & tipe pertanyaan dari AI (hook
 * usePrdProject.runQuestions); UI hanya me-render apa yang diterima.
 *
 * Navigasi: prev/next menjaga jawaban (disimpan ke project.answers), opsi
 * "Lewati" membiarkan kosong — AI lanjut pakai info yang ada. Pertanyaan
 * penting (required:true) diberi tanda, tapi tetap bisa dilewati.
 */
export function Clarify({
  questions = [],
  answers = {},
  index,
  onAnswer,
  onPrev,
  onNext,
  onSkip,
  loading,
  loadingMessage,
  error,
  onRetry,
}) {
  const total = questions.length
  const q = questions[index]
  const value = q ? answers[q.id] : undefined

  if (!q) return null

  const answered = normalizeAnswer(value) != null
  const isLast = index === total - 1

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <StepHeader
        label={`Pertanyaan ${index + 1} dari ${total}`}
        title={q.question}
        description="Biar PRD lebih akurat, AI perlu memastikan beberapa hal tentang produk kamu."
      />

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <StageLoading message={loadingMessage} />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          {q.help && (
            <p className="mb-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground/80">
              <span className="mt-px flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-border text-[9px]">i</span>
              <span>{q.help}</span>
            </p>
          )}

          <QuestionField
            type={q.type}
            options={q.options}
            placeholder={q.placeholder}
            value={value}
            onChange={(v) => onAnswer(q.id, v)}
          />

          {q.required && !answered && (
            <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400">
              Disarankan dijawab karena memengaruhi struktur produk.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" size="sm" onClick={onPrev} disabled={index === 0} className="gap-1.5 self-start sm:self-auto">
              <ArrowLeft className="h-3.5 w-3.5" />
              Sebelumnya
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onSkip(q.id)} className="gap-1.5">
                <SkipForward className="h-3.5 w-3.5" />
                Lewati
              </Button>
              <Button onClick={onNext} size="sm" className="gap-1.5">
                {isLast ? 'Lanjut' : 'Berikutnya'}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && !loading && <StageError message={error} onRetry={onRetry} retryLabel="Coba lagi" />}

      {!loading && (
        <div className="flex items-center justify-center gap-1.5">
          {questions.map((qq, i) => (
            <span
              key={qq.id}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-primary' : normalizeAnswer(answers[qq.id]) != null ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-muted-foreground/25'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      )}
    </div>
  )
}
