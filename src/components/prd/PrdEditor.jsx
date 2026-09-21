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
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Kolom baca --doc-col dipakai semua blok teks, di luar & di dalam
          lembar: judul, isi dokumen, dan toolbar berbagi satu tepi kiri;
          hanya kertasnya yang melebar. Blok ber-padding memakai calc agar
          TEKS-nya (bukan kotaknya) pas kolom. */}
      <div className="mx-auto w-full max-w-[var(--doc-col)]">
        <StepHeader
          step="05"
          label="PRD"
          title={project?.projectName || 'Product Requirements Document'}
          description="PRD dibuat dari seluruh konteks: ide, jawaban klarifikasi, teknologi, dan struktur. Edit tiap section sesuai kebutuhan."
        />
      </div>

      {loading && (
        <div className="mx-auto max-w-[var(--doc-col)] rounded-xl border border-border bg-card p-6">
          <StageLoading message={loadingMessage} />
        </div>
      )}

      {sections.length === 0 && !loading ? (
        <div className="mx-auto max-w-[var(--doc-col)] rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">PRD belum berhasil dibuat.</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 h-11 gap-1.5 sm:h-8">
            <RotateCcw className="h-3.5 w-3.5" />
            Coba lagi
          </Button>
        </div>
      ) : (
        <>
          {/* Satu lembar dokumen: section dipisah garis tipis, judul serif
              mengikuti motif draf dokumen langkah-langkah sebelumnya. */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="divide-y divide-border">
              {sections.map((s) => {
                const editing = editingId === s.id
                return (
                  <section key={s.id} className="group">
                    {/* basis-48 memaksa baris aksi turun di layar sempit, jadi
                        tombol tetap 44px tanpa memangsa judul. */}
                    <div className="mx-auto flex max-w-[calc(var(--doc-col)+2.5rem)] flex-wrap items-center gap-x-1.5 gap-y-1 px-5 pb-2 pt-4">
                      <h3 className="min-w-0 flex-1 basis-48 truncate font-serif text-[15px] font-medium text-foreground">{s.title}</h3>
                      {s.status === SECTION_STATUS.NEEDS && (
                        <span className="flex-shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
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
                              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 sm:h-7 sm:w-7"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              aria-label="Batal edit"
                              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-7 sm:w-7"
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
                              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-7 sm:w-7"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <CopyButton text={s.content} className="h-11 w-11 justify-center p-0 sm:h-7 sm:w-7 sm:p-1.5" />
                            <button
                              type="button"
                              onClick={() => {
                                setRegenTarget(s)
                                setRegenError(null)
                              }}
                              aria-label="Regenerate section dengan AI"
                              title="Regenerate dengan AI"
                              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-7 sm:w-7"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => delSection(s.id)}
                              aria-label="Hapus section"
                              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:h-7 sm:w-7"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {editing ? (
                      <div className="mx-auto max-w-[calc(var(--doc-col)+2.5rem)] px-5 pb-5">
                        <Textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          className="min-h-[200px] resize-y rounded-none border-0 text-[13px] focus-visible:ring-0"
                        />
                      </div>
                    ) : (
                      <div className="mx-auto max-w-[calc(var(--doc-col)+2.5rem)] px-5 pb-5 text-[15px] leading-relaxed text-foreground">
                        <Markdown text={s.content} />
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={addSection}
            className="mx-auto flex w-full max-w-[var(--doc-col)] items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-accent/30 hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Tambah section
          </button>
        </>
      )}

      {error && !loading && <StageError message={error} onRetry={onRetry} retryLabel="Coba lagi" />}

      {/* Toolbar ekspor & aksi akhir */}
      <div className="mx-auto w-full max-w-[var(--doc-col)] space-y-4 border-t border-border pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton text={md} withLabel className="h-11 rounded-lg border border-border px-4 sm:h-9" />
          <Button variant="outline" size="sm" onClick={() => exportMarkdown(project)} className="h-11 gap-1.5 px-4 sm:h-9 sm:px-3">
            <Download className="h-3.5 w-3.5" />
            Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportJSON(project)} className="h-11 gap-1.5 px-4 sm:h-9 sm:px-3">
            <FileJson className="h-3.5 w-3.5" />
            JSON
          </Button>
          <span className="text-[11px] text-muted-foreground">
            PDF/DOCX segera
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-11 gap-1.5 sm:h-8">
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali
          </Button>
          <Button variant="outline" size="sm" onClick={onNew} className="h-11 sm:h-8">
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
