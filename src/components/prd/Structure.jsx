import { useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, Pencil, Plus, RotateCcw, Trash2, Check } from 'lucide-react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { StageError, StageLoading } from './StageLoading'
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
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Header />
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <StageLoading message={loadingMessage} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Header />

      {features.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Struktur produk belum berhasil dibuat.</p>
          <Button variant="outline" size="sm" onClick={onRegenerate} className="mt-4 gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Generate ulang
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {features.map((f, fi) => (
            <div key={f.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
                {editing?.type === 'feature' && editing.featureId === f.id ? (
                  <Input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
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
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-semibold text-foreground"
                  >
                    <Pencil className="h-3 w-3 flex-shrink-0 text-muted-foreground/60" />
                    <span className="truncate">{f.name}</span>
                  </button>
                )}

                <div className="flex flex-shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(fi, -1)}
                    disabled={fi === 0}
                    aria-label="Naikkan fitur"
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(fi, 1)}
                    disabled={fi === features.length - 1}
                    aria-label="Turunkan fitur"
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => delFeature(f.id)}
                    aria-label="Hapus fitur"
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-border">
                {f.subFeatures.map((s, si) => (
                  <div key={s.id} className="flex items-center gap-2 px-3 py-2">
                    {editing?.type === 'sub' && editing.subId === s.id ? (
                      <Input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
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
                        className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3 flex-shrink-0 text-muted-foreground/50" />
                        <span className="truncate">{s.name}</span>
                      </button>
                    )}
                    <div className="flex flex-shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveSub(fi, si, -1)}
                        disabled={si === 0}
                        aria-label="Naikkan sub-fitur"
                        className="rounded p-1 text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-25"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSub(fi, si, 1)}
                        disabled={si === f.subFeatures.length - 1}
                        aria-label="Turunkan sub-fitur"
                        className="rounded p-1 text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-25"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => delSub(f.id, s.id)}
                        aria-label="Hapus sub-fitur"
                        className="rounded p-1 text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {f.subFeatures.length === 0 && (
                  <p className="px-3 py-2 text-[11px] italic text-muted-foreground/60">Belum ada sub-fitur.</p>
                )}
                <button
                  type="button"
                  onClick={() => addSub(f.id)}
                  className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
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
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Tambah fitur
          </button>
        </div>
      )}

      {error && <StageError message={error} onRetry={onRetry} retryLabel="Generate ulang" />}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRegenerate} disabled={loading} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Regenerate Structure
          </Button>
          <Button size="sm" onClick={onContinue} disabled={loading || features.length === 0}>
            Lanjut ke PRD
            <Check className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Struktur Produk</p>
      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Review struktur produk kamu</h2>
      <p className="text-sm text-muted-foreground">Struktur ini dibuat AI dari ide dan jawaban kamu. Ubah, tambah, atau hapus sesuai kebutuhan.</p>
    </div>
  )
}
