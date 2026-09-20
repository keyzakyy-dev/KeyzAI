import { collectQAPairs, TECH_KEYS } from '../../state/prd-model'
import { KeyMark } from '../../lib/key-mark'

/**
 * Panel konteks (kolom kanan) PRD Builder: merangkum semua yang AI sudah
 * ketahui tentang proyek — ide, analisis, jawaban klarifikasi, teknologi,
 * struktur, dan progres PRD. Semua datanya sudah ada di objek project;
 * panel ini hanya menyusunnya supaya user tidak perlu scroll ulang-alik.
 */
export function ContextPanel({ project, working = false, loadingMessage = '' }) {
  if (!project) return null

  const a = project.aiAnalysis || {}
  const qa = collectQAPairs(project)
  const stack = project.technologyStack || {}
  const features = project.productStructure?.features || []
  const sections = project.prd?.sections || []
  const answered = qa.filter((p) => !p.skipped).length

  const hasAnalysis = a.productType || a.domain || a.problem
  const stackLines = TECH_KEYS.map((k) => [k, typeof stack[k] === 'string' ? stack[k] : stack[k]?.name]).filter(([, v]) => v)

  return (
    <aside
      aria-label="Konteks proyek"
      className="space-y-4 self-start rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Konteks Proyek</p>
          <h3 className="mt-0.5 truncate text-sm font-semibold text-foreground" title={project.projectName}>
            {project.projectName || 'PRD'}
          </h3>
        </div>
        {working && (
          <span className="flex flex-shrink-0 items-center gap-1.5 text-[11px] text-primary" role="status">
            <KeyMark className="h-3.5 w-3.5" />
            <span key={loadingMessage} className="thinking-fade">{loadingMessage || 'Memproses…'}</span>
          </span>
        )}
      </div>

      <Block label="Ide">
        <p className="line-clamp-5 whitespace-pre-line text-xs leading-relaxed text-muted-foreground" title={project.projectIdea}>
          {project.projectIdea}
        </p>
      </Block>

      {hasAnalysis && (
        <Block label="Analisis AI">
          <ul className="space-y-1 text-xs">
            {a.productType && <Line k="Tipe" v={a.productType} />}
            {a.domain && <Line k="Domain" v={a.domain} />}
            {a.problem && <li className="line-clamp-3 text-muted-foreground" title={a.problem}>{a.problem}</li>}
          </ul>
          {a.targetUsers?.length > 0 && <Chips items={a.targetUsers} />}
        </Block>
      )}

      {qa.length > 0 && (
        <Block label={`Jawaban klarifikasi (${answered}/${qa.length})`}>
          <ul className="space-y-2">
            {qa.map((p) => (
              <li key={p.question}>
                <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">{p.question}</p>
                <p className={`truncate text-xs ${p.skipped ? 'italic text-muted-foreground/50' : 'text-foreground'}`} title={p.answer || 'Dilewati'}>
                  {p.skipped ? 'Dilewati' : p.answer}
                </p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {stackLines.length > 0 && (
        <Block label="Teknologi">
          <ul className="space-y-0.5 text-xs">
            {stackLines.map(([k, v]) => (
              <Line key={k} k={k} v={v} />
            ))}
          </ul>
        </Block>
      )}

      {features.length > 0 && (
        <Block label={`Struktur (${features.length} fitur)`}>
          <ul className="space-y-0.5 text-xs">
            {features.map((f) => (
              <li key={f.id} className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-foreground">{f.name}</span>
                <span className="flex-shrink-0 tabular-nums text-muted-foreground/60">{f.subFeatures?.length || 0} sub</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {sections.length > 0 && (
        <Block label="PRD">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{sections.length} section</span> dibuat
            {sections.some((s) => s.status === 'needs-clarification') && (
              <span className="text-amber-600 dark:text-amber-400"> · {sections.filter((s) => s.status === 'needs-clarification').length} perlu diklarifikasi</span>
            )}
          </p>
        </Block>
      )}
    </aside>
  )
}

function Block({ label, children }) {
  return (
    <section className="space-y-1.5 border-t border-border pt-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{label}</p>
      {children}
    </section>
  )
}

function Line({ k, v }) {
  return (
    <li className="flex items-baseline gap-1.5">
      <span className="flex-shrink-0 capitalize text-muted-foreground/70">{k}:</span>
      <span className="min-w-0 truncate text-foreground" title={v}>{v}</span>
    </li>
  )
}

function Chips({ items }) {
  return (
    <div className="flex flex-wrap gap-1 pt-1">
      {items.slice(0, 6).map((t) => (
        <span key={t} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
          {t}
        </span>
      ))}
    </div>
  )
}
