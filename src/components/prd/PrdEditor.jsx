import { useState } from 'react'
import { ArrowLeft, Check, Download, FileJson, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react'

import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { CopyButton } from '../../lib/copy-button'
import { Markdown } from '../../lib/markdown'
import { StageError, StageLoading } from './StageLoading'
import { StepHeader } from './StepHeader'
import { RegenerateDialog } from './RegenerateDialog'
import { newId } from '../../state/ids'
import { exportJSON, exportMarkdown, projectToMarkdown } from '../../lib/prd-export'
import { SECTION_STATUS } from '../../state/prd-model'

/**
 * STEP 5 — Tampilan & editor PRD. Tiap section: render markdown, edit
 * inline (Save/Cancel), Copy, Delete, Regenerate (modal instruksi, AI hanya
 * sentuh section itu). Section baru bisa ditambahkan.
 *
 * Export: Copy Markdown + download .md + download .json (file nyata, pola
 * lib/backup.js). PDF/DOCX abstraction ada di lib/prd-export.js.
 */
export function PrdEditor({
  project,
  sections = [],
  onChangeSections,
  onRegenerateSection,
  onBack,
  onNew,
  loading,
  loadingMessage,
  error,
  onRetry,
}) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState('')
  const [regenTarget, setRegenTarget] = useState(null) // section
  const [regenError, setRegenError] = useState(null)

  const startEdit = (s) => {
    setEditingId(s.id)
    setDraft(s.content)
  }
  const saveEdit = (id) => {
    onChangeSections(sections.map((s) => (s.id === id ? { ...s, content: draft } : s)))
    setEditingId(null)
  }
  const delSection = (id) => onChangeSections(sections.filter((s) => s.id !== id))
  const addSection = () => {
    const s = { id: newId('sec'), title: 'Section Baru', content: '## Section Baru\n\nTulis di sini…', status: SECTION_STATUS.OK }
    onChangeSections([...sections, s])
    setEditingId(s.id)
    setDraft(s.content)
  }

  const handleRegenConfirm = async (instruction) => {
    if (!regenTarget) return
    setRegenError(null)
    try {
      await onRegenerateSection({
        sectionTitle: regenTarget.title,
        sectionContent: regenTarget.content,
        instruction,
      })
      setRegenTarget(null)
    } catch (e) {
      setRegenError(e.message || 'Gagal meregenerate section')
    }
  }

  const md = projectToMarkdown(project)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <StepHeader
        label="PRD"
        title={project?.projectName || 'Product Requirements Document'}
        description="PRD dibuat dari seluruh konteks: ide, jawaban klarifikasi, teknologi, dan struktur. Edit tiap section sesuai kebutuhan."
      />

      {loading && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <StageLoading message={loadingMessage} />
        </div>
      )}

      {sections.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">PRD belum berhasil dibuat.</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Coba lagi
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((s) => {
            const editing = editingId === s.id
            return (
              <section
                key={s.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
                  <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{s.title}</h3>
                  {s.status === SECTION_STATUS.NEEDS && (
                    <span className="flex-shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      Belum ditentukan
                    </span>
                  )}
                  <div className="flex flex-shrink-0 items-center gap-0.5">
                    {editing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(s.id)}
                          disabled={!draft.trim()}
                          aria-label="Simpan section"
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          aria-label="Batal edit"
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={() => startEdit(s)}
                          aria-label="Edit section"
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <CopyButton text={s.content} className="p-1.5" />
                        <button
                          type="button"
                          onClick={() => {
                            setRegenTarget(s)
                            setRegenError(null)
                          }}
                          aria-label="Regenerate section dengan AI"
                          title="Regenerate dengan AI"
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => delSection(s.id)}
                          aria-label="Hapus section"
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {editing ? (
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="min-h-[200px] resize-y rounded-none border-0 text-[13px] focus-visible:ring-0"
                  />
                ) : (
                  <div className="px-5 py-4 text-[15px] text-foreground">
                    <Markdown text={s.content} />
                  </div>
                )}
              </section>
            )
          })}

          <button
            type="button"
            onClick={addSection}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-accent/30 hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Tambah section
          </button>
        </div>
      )}

      {error && !loading && <StageError message={error} onRetry={onRetry} retryLabel="Coba lagi" />}

      {/* Toolbar ekspor & aksi akhir */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton text={md} withLabel className="h-9 rounded-lg border border-border px-3" />
          <Button variant="outline" size="sm" onClick={() => exportMarkdown(project)} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportJSON(project)} className="gap-1.5">
            <FileJson className="h-3.5 w-3.5" />
            JSON
          </Button>
          <span
            title="PDF & DOCX: sambungkan library export di lib/prd-export.js"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60"
          >
            <Download className="h-3 w-3" />
            PDF/DOCX segera
          </span>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali
          </Button>
          <Button variant="outline" size="sm" onClick={onNew}>
            PRD baru
          </Button>
        </div>
      </div>

      <RegenerateDialog
        open={!!regenTarget}
        onOpenChange={(o) => !o && setRegenTarget(null)}
        sectionTitle={regenTarget?.title}
        onConfirm={handleRegenConfirm}
        loading={loading}
        error={regenError}
      />
    </div>
  )
}
