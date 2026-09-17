import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Download, Loader2, Settings, Trash2, LogOut, X, Check } from 'lucide-react'
import { Button } from './ui/button'
import { ConfirmDialog } from './ui/confirm-dialog'
import { MODELS, DEFAULT_MODEL } from '../lib/models'
import { normalizeDisplayName, isValidDisplayName } from '../lib/preferences'

const SIDEBAR_MIN = 220
const SIDEBAR_MAX = 420

// Dialog preferensi akun: info akun, model default, lebar sidebar default,
// dan aksi data (ekspor / hapus semua / keluar). Nilai dikirim ke server
// (D1) sehingga sinkron lintas perangkat.
export function PreferencesDialog({
  open,
  onOpenChange,
  user,
  prefs,
  saving,
  error,
  onSaveDisplayName,
  onUpdatePrefs,
  onDeleteAll,
  onExportAll,
  onLogout,
}) {
  // ---- nama tampilan
  const [name, setName] = useState('')
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState(null)
  useEffect(() => {
    if (open) {
      setName(user?.name || '')
      setNameSaved(false)
      setNameError(null)
    }
  }, [open, user?.name])

  // ---- lebar sidebar (baris lokal agar slider halus; simpan dengan debounce)
  const [width, setWidth] = useState(prefs.sidebar_width)
  useEffect(() => {
    if (open) setWidth(prefs.sidebar_width)
  }, [open, prefs.sidebar_width])
  useEffect(() => {
    if (!open || width === prefs.sidebar_width) return
    const t = setTimeout(() => {
      onUpdatePrefs({ sidebar_width: width }).catch(() => {})
    }, 500)
    return () => clearTimeout(t)
  }, [width, prefs.sidebar_width, open, onUpdatePrefs])

  const model = MODELS.some((m) => m.id === prefs.default_model) ? prefs.default_model : DEFAULT_MODEL
  const nameDirty = normalizeDisplayName(name) !== (user?.name || '')
  const nameValid = isValidDisplayName(name)

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteDone, setDeleteDone] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const commitName = async () => {
    if (!nameDirty || !nameValid || saving) return
    setNameError(null)
    try {
      const nextUser = await onSaveDisplayName(name)
      if (nextUser) {
        setNameSaved(true)
        setTimeout(() => setNameSaved(false), 2000)
      }
    } catch (e) {
      setNameError(e.message || 'Gagal menyimpan nama')
    }
  }

  const confirmDeleteAll = async () => {
    setDeleting(true)
    try {
      await onDeleteAll()
      setDeleteDone(true)
      setDeleteConfirm(false)
    } catch (e) {
      setDeleteError(e.message || 'Gagal menghapus percakapan')
    } finally {
      setDeleting(false)
    }
  }
  const [deleteError, setDeleteError] = useState(null)

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="announcement-fade fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="announcement-pop fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl focus:outline-none">
            {/* Header */}
            <div className="relative border-b border-border bg-card p-6 sm:p-7">
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Tutup"
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
              <div className="relative space-y-2 pr-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-foreground">
                  <Settings className="h-6 w-6" />
                </span>
                <Dialog.Title className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Preferensi akun
                </Dialog.Title>
                <Dialog.Description className="text-sm leading-relaxed text-muted-foreground">
                  Pengaturan ini tersimpan di akunmu dan mengikuti saat masuk di perangkat lain.
                </Dialog.Description>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-7">
              <div className="space-y-8">
                {/* Akun */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Akun</h3>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-accent">
                      {user?.picture ? (
                        <img src={user.picture} alt={user?.name || 'Akun'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-sm font-medium text-foreground">
                          {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{user?.name || 'Pengguna'}</p>
                      {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="prefs-display-name" className="block text-sm font-medium text-foreground">
                      Nama tampilan
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="prefs-display-name"
                        type="text"
                        maxLength={40}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={user?.name || 'Nama'}
                        className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                      <Button
                        size="sm"
                        onClick={commitName}
                        disabled={!nameDirty || !nameValid || saving}
                        className="shrink-0"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Simpan
                      </Button>
                    </div>
                    {nameSaved && <p className="text-xs text-primary">Nama disimpan</p>}
                    {nameError && <p className="text-xs text-destructive">{nameError}</p>}
                  </div>
                </section>

                {/* Preferensi */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preferensi</h3>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Model default</p>
                    <p className="text-xs text-muted-foreground">Model yang dipakai untuk chat baru di semua perangkat.</p>
                    <div className="grid gap-2">
                      {MODELS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => m.id !== model && onUpdatePrefs({ default_model: m.id }).catch(() => {})}
                          disabled={saving}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                            m.id === model
                              ? 'border-primary/50 bg-accent/60 text-foreground'
                              : 'border-border text-muted-foreground hover:bg-accent/40 hover:text-foreground'
                          } disabled:opacity-60`}
                        >
                          <span className="font-medium">{m.label}</span>
                          {m.id === model && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Lebar sidebar default</p>
                      <span className="text-xs text-muted-foreground">{width}px</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Dipakai sebagai lebar awal sidebar di perangkat baru.</p>
                    <input
                      type="range"
                      min={SIDEBAR_MIN}
                      max={SIDEBAR_MAX}
                      step={8}
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="w-full"
                      aria-label="Lebar sidebar default"
                    />
                  </div>

                  {error && (
                    <p
                      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                      role="alert"
                    >
                      {error}
                    </p>
                  )}
                </section>

                {/* Data & privasi */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data & privasi</h3>

                  <Button variant="outline" className="w-full justify-start gap-2" onClick={onExportAll}>
                    <Download className="h-4 w-4" />
                    Ekspor semua percakapan
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => { setDeleteError(null); setDeleteConfirm(true) }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus semua percakapan
                  </Button>
                  {deleteDone && <p className="text-xs text-primary">Semua percakapan dihapus.</p>}
                  {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}

                  <div className="h-px bg-border" />

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={onLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </Button>
                </section>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={(o) => !o && setDeleteConfirm(false)}
        title="Hapus semua percakapan?"
        description="Semua percakapan akun ini akan dihapus permanen dari server. Tindakan ini tidak bisa dibatalkan."
        confirmLabel={deleting ? 'Menghapus…' : 'Hapus semua'}
        danger
        onConfirm={confirmDeleteAll}
      />
    </>
  )
}