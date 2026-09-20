import { useState } from 'react'
import { Check, Pencil } from 'lucide-react'

import { Input } from '../ui/input'
import { collectQAPairs, TECH_KEYS } from '../../state/prd-model'
import { KeyMark } from '../../lib/key-mark'

/**
 * Panel konteks (kolom kanan) PRD Builder: ringkasan proyek yang AI sudah
 * ketahui. Sengaja minimalis — info panjang dilipat pakai <details> native,
 * supaya panel tetap tenang dan tidak menyaingi konten utama.
 */
export function ContextPanel({ project, working = false, loadingMessage = '', savedAt, onRename }) {
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  if (!project) return null

  const commitName = () => {
    const name = nameDraft.trim()
    setEditingName(false)
    if (name && name !== project.projectName) onRename?.({ projectName: name })
  }

  const savedLabel = !savedAt
    ? null
    : `Tersimpan ${new Date(savedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`

  const a = project.aiAnalysis || {}
  const qa = collectQAPairs(project)
  const stack = project.technologyStack || {}
  const features = project.productStructure?.features || []
  const sections = project.prd?.sections || []
  const answered = qa.filter((p) => !p.skipped).length

  const hasAnalysis = a.productType || a.domain || a.problem
  const stackLines = TECH_KEYS.map((k) => [k, typeof stack[k] === 'string' ? stack[k] : stack[k]?.name]).filter(([, v]) => v)
  const needsCount = sections.filter((s) => s.status === 'needs-clarification').length

  return (
    <aside
      aria-label="Konteks proyek"
      className="divide-y divide-border self-start rounded-2xl border border-border bg-card/60 px-4 py-3 shadow-sm backdrop-blur lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-3 pb-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Konteks Proyek</p>
          {editingName ? (
            <Input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName()
                if (e.key === 'Escape') setEditingName(false)
              }}
              maxLength={120}
              className="mt-0.5 h-8 text-sm"
            />
          ) : (
            <button
              type="button"
              title="Ganti nama PRD"
              onClick={() => {
                setNameDraft(project.projectName || '')
                setEditingName(true)
              }}
              className="mt-0.5 flex min-w-0 items-center gap-1.5 text-left text-sm font-semibold text-foreground transition-opacity hover:opacity-80"
            >
              <span className="truncate" title={project.projectName}>
                {project.projectName || 'PRD'}
              </span>
              <Pencil className="h-3 w-3 flex-shrink-0 text-muted-foreground/50" />
            </button>
          )}
          {savedLabel && !working && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/70">
              <Check className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
              {savedLabel}
            </p>
          )}
        </div>
        {working && (
          <span className="flex flex-shrink-0 items-center gap-1.5 text-[11px] text-primary" role="status">
            <KeyMark className="h-3.5 w-3.5" />
            <span key={loadingMessage} className="thinking-fade">{loadingMessage || 'Memproses…'}</span>
          </span>
        )}
      </div>

      <section className="py-2.5">
        <p className="line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-muted-foreground" title={project.projectIdea}>
          {project.projectIdea}
        </p>
        {hasAnalysis && (
          <p className="mt-1.5 text-xs leading-relaxed">
            {a.productType && <span className="font-medium text-foreground">{a.productType}</span>}
            {a.productType && a.domain && <span className="text-muted-foreground/50"> · </span>}
            {a.domain && <span className="text-muted-foreground">{a.domain}</span>}
            {a.problem && <span className="line-clamp-2 block text-muted-foreground/80">{a.problem}</span>}
          </p>
        )}
      </section>

      {qa.length > 0 && (
        <Fold label={`Jawaban (${answered}/${qa.length})`}>
          <ul className="space-y-2">
            {qa.map((p) => (
              <li key={p.question}>
                <p className="line-clamp-1 text-[11px] leading-snug text-muted-foreground">{p.question}</p>
                <p className={`truncate text-xs ${p.skipped ? 'italic text-muted-foreground/50' : 'text-foreground'}`} title={p.answer || 'Dilewati'}>
                  {p.skipped ? 'Dilewati' : p.answer}
                </p>
              </li>
            ))}
          </ul>
        </Fold>
      )}

      {stackLines.length > 0 && (
        <Fold label="Teknologi">
          <ul className="space-y-0.5 text-xs">
            {stackLines.map(([k, v]) => (
              <li key={k} className="flex items-baseline gap-1.5">
                <span className="flex-shrink-0 capitalize text-muted-foreground/70">{k}:</span>
                <span className="min-w-0 truncate text-foreground" title={v}>{v}</span>
              </li>
            ))}
          </ul>
        </Fold>
      )}

      {features.length > 0 && (
        <Fold label={`Struktur (${features.length} fitur)`}>
          <ul className="space-y-0.5 text-xs">
            {features.map((f) => (
              <li key={f.id} className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-foreground">{f.name}</span>
                <span className="flex-shrink-0 tabular-nums text-muted-foreground/60">{f.subFeatures?.length || 0}</span>
              </li>
            ))}
          </ul>
        </Fold>
      )}

      {sections.length > 0 && (
        <p className="py-2.5 text-xs text-muted-foreground">
          PRD: <span className="font-medium text-foreground">{sections.length} section</span>
          {needsCount > 0 && <span className="text-amber-600 dark:text-amber-400"> · {needsCount} perlu klarifikasi</span>}
        </p>
      )}
    </aside>
  )
}

// Baris lipatan: <details> native — tanpa state, keyboard & a11y gratis.
function Fold({ label, children }) {
  return (
    <details className="group py-2.5">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        {label}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-3 w-3 flex-shrink-0 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="pt-2">{children}</div>
    </details>
  )
}
