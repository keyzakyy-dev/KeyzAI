import { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, RotateCcw, Trash2, Check } from 'lucide-react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { StageError, StageLoading } from './StageLoading'
import { StepHeader, StageNav } from './StepHeader'
import { newId } from '../../state/ids'

/**
 * STEP 4 — Product Structure. Fitur & sub-fitur dari AI (stage 'structure'),
 * bisa diedit: rename, tambah, hapus, reorder naik/turun. Struktur dijamin
 * spesifik per project — UI ini hanya manipulasi pohon, isi dari AI.
 */
export function Structure({ structure = { features: [] }, onChange, onRegenerate, onContinue, onBack, loading, loadingMessage, error, onRetry }) {
  const features = structure.features || []
  const [editing, setEditing] = useState(null) // { type:'feature'|'sub', featureId, subId }
  const [draft, setDraft] = useState('')

  const update = (next) => onChange(next)

  const renameFeature = (id, name) => {
    update(features.map((f) => (f.id === id ? { ...f, name } : f)))
  }
  const renameSub = (fid, sid, name) => {
    update(features.map((f) => (f.id === fid ? { ...f, subFeatures: f.subFeatures.map((s) => (s.id === sid ? { ...s, name } : s)) } : f)))
  }
  const addFeature = () => {
    const f = { id: newId('f'), name: 'Fitur baru', subFeatures: [] }
    update([...features, f])
    setEditing({ type: 'feature', featureId: f.id })
    setDraft(f.name)
  }
  const addSub = (fid) => {
    const s = { id: newId('f_s'), name: 'Sub-fitur baru' }
    update(features.map((f) => (f.id === fid ? { ...f, subFeatures: [...f.subFeatures, s] } : f)))
    setEditing({ type: 'sub', featureId: fid, subId: s.id })
    setDraft(s.name)
  }
  const delFeature = (id) => update(features.filter((f) => f.id !== id))
  const delSub = (fid, sid) =>
    update(features.map((f) => (f.id === fid ? { ...f, subFeatures: f.subFeatures.filter((s) => s.id !== sid) } : f)))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= features.length) return
    const next = [...features]
    ;[next[i], next[j]] = [next[j], next[i]]
    update(next)
  }
  const moveSub = (fi, i, dir) => {
    const f = features[fi]
    if (!f) return
    const j = i + dir
    if (j < 0 || j >= f.subFeatures.length) return
    const subs = [...f.subFeatures]
    ;[subs[i], subs[j]] = [subs[j], subs[i]]
    update(features.map((x) => (x.id === f.id ? { ...x, subFeatures: subs } : x)))
  }

  const commitRename = () => {
    const name = draft.trim()
    if (!name) {
      setEditing(null)
      return
    }
    if (editing.type === 'feature') renameFeature(editing.featureId, name)
    else renameSub(editing.featureId, editing.subId, name)
    setEditing(null)
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <StepHeader
          step="04"
          label="Struktur Produk"
          title="Review struktur produk kamu"
          description="Struktur ini dibuat AI dari ide dan jawaban kamu. Ubah, tambah, atau hapus sesuai kebutuhan."
        />
        <div className="rounded-xl border border-border bg-card p-6">
          <StageLoading message={loadingMessage} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <StepHeader
        step="04"
        label="Struktur Produk"
        title="Review struktur produk kamu"
        description="Struktur ini dibuat AI dari ide dan jawaban kamu. Ubah, tambah, atau hapus sesuai kebutuhan."
      />

      {features.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">Struktur produk belum berhasil dibuat.</p>
          <Button variant="outline" size="sm" onClick={onRegenerate} className="mt-4 h-11 gap-1.5 sm:h-8">
            <RotateCcw className="h-3.5 w-3.5" />
            Generate ulang
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {features.map((f, fi) => (
            <div key={f.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3.5 py-2">
                {editing?.type === 'feature' && editing.featureId === f.id ? (
                  <Input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') setEditing(null)
                    }}
                    maxLength={80}
                    className="h-8 flex-1 text-sm"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing({ type: 'feature', featureId: f.id })
                      setDraft(f.name)
                    }}
                    className="group flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-semibold text-foreground"
                  >
                    <Pencil className="h-3 w-3 flex-shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60" />
                    <span className="truncate">{f.name}</span>
                    <span className="ml-1 flex-shrink-0 rounded-full bg-background px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground">
                      {f.subFeatures?.length || 0}
                    </span>
                  </button>
                )}

                <div className="flex flex-shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(fi, -1)}
                    disabled={fi === 0}
                    aria-label="Naikkan fitur"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 sm:h-7 sm:w-7"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(fi, 1)}
                    disabled={fi === features.length - 1}
                    aria-label="Turunkan fitur"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 sm:h-7 sm:w-7"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => delFeature(f.id)}
                    aria-label="Hapus fitur"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:h-7 sm:w-7"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-border">
                {f.subFeatures.map((s, si) => (
                  <div key={s.id} className="group flex items-center gap-2 px-3.5 py-2">
                    {editing?.type === 'sub' && editing.subId === s.id ? (
                      <Input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename()
                          if (e.key === 'Escape') setEditing(null)
                        }}
                        maxLength={80}
                        className="h-8 flex-1 text-sm"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditing({ type: 'sub', featureId: f.id, subId: s.id })
                          setDraft(s.name)
                        }}
                        className="flex min-w-0 flex-1 items-center gap-1.5 pl-5 text-left text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <span className="h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground/40" />
                        <span className="truncate">{s.name}</span>
                      </button>
                    )}
                    <div className="flex flex-shrink-0 items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => moveSub(fi, si, -1)}
                        disabled={si === 0}
                        aria-label="Naikkan sub-fitur"
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-25 sm:h-6 sm:w-6"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSub(fi, si, 1)}
                        disabled={si === f.subFeatures.length - 1}
                        aria-label="Turunkan sub-fitur"
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-25 sm:h-6 sm:w-6"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => delSub(f.id, s.id)}
                        aria-label="Hapus sub-fitur"
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:h-6 sm:w-6"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {f.subFeatures.length === 0 && (
                  <p className="px-3.5 py-2 text-[11px] italic text-muted-foreground">Belum ada sub-fitur.</p>
                )}
                <button
                  type="button"
                  onClick={() => addSub(f.id)}
                  className="flex w-full items-center gap-1.5 px-3.5 py-3 text-left text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground sm:py-2"
                >
                  <Plus className="h-3 w-3" />
                  Tambah sub-fitur
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addFeature}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-accent/30 hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Tambah fitur
          </button>
        </div>
      )}

      {error && <StageError message={error} onRetry={onRetry} retryLabel="Generate ulang" />}

      <StageNav
        onBack={onBack}
        onNext={onContinue}
        nextDisabled={loading || features.length === 0}
        nextLabel="Lanjut ke PRD"
      >
        <Button variant="outline" size="sm" onClick={onRegenerate} disabled={loading} className="h-11 gap-1.5 sm:h-8">
          <RotateCcw className="h-3.5 w-3.5" />
          Generate ulang
        </Button>
      </StageNav>
    </div>
  )
}

