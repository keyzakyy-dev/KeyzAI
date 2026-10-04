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
  const answeredCount = questions.filter((qq) => normalizeAnswer(answers[qq.id]) != null).length

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <StepHeader
        step="02"
        label={`Klarifikasi · ${index + 1}/${total}`}
        title={q.question}
        description="Biar PRD lebih akurat, AI perlu memastikan beberapa hal tentang produk kamu."
      />

      {loading ? (
        <div className="tui-panel p-6">
          <span className="tui-inset-title" aria-hidden="true">klarifikasi</span>
          <StageLoading message={loadingMessage} />
        </div>
      ) : (
        <div className="tui-panel p-4 sm:p-6">
          <span className="tui-inset-title" aria-hidden="true">klarifikasi</span>
          <QuestionField
            type={q.type}
            options={q.options}
            placeholder={q.placeholder}
            value={value}
            onChange={(v) => onAnswer(q.id, v)}
          />

          {q.help && (
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Kenapa ditanya? {q.help}
            </p>
          )}

          {q.required && !answered && (
            <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
              Disarankan dijawab karena memengaruhi struktur produk.
            </p>
          )}
        </div>
      )}

      {error && !loading && <StageError message={error} onRetry={onRetry} retryLabel="Coba lagi" />}

      {!loading && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-1.5">
            {questions.map((qq, i) => (
              <span
                key={qq.id}
                className={`h-1.5 rounded-[1px] transition-all ${
                  i === index ? 'w-6 bg-primary' : normalizeAnswer(answers[qq.id]) != null ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-muted-foreground/25'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
          <p className="text-[11px] tabular-nums text-muted-foreground">
            {answeredCount} dari {total} terjawab
          </p>
        </div>
      )}
    </div>
  )
}
