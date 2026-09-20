import { useEffect, useState, lazy, Suspense } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Download, LoaderCircle, Trash2, LogOut, X, Check } from 'lucide-react'

import { Button } from './ui/button'
import { ConfirmDialog } from './ui/confirm-dialog'
import { MODELS, DEFAULT_MODEL } from '../lib/models'
import { normalizeDisplayName, isValidDisplayName } from '../lib/preferences'
import { computeUsage } from '../lib/usage'
import { useCountUp } from '../lib/micro-anim'

// recharts cukup besar — dimuat saat tab Pemakaian pertama kali dibuka
const TokenChart = lazy(() => import('./token-chart'))

function TokenStat({ value, label }) {
  const v = useCountUp(value)
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-5 text-center">
      <p className="text-2xl font-semibold tabular-nums text-foreground">± {v.toLocaleString('id-ID')}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

const SIDEBAR_MIN = 220
const SIDEBAR_MAX = 420

const TABS = [
  { id: 'account', label: 'Akun' },
  { id: 'prefs', label: 'Preferensi' },
  { id: 'usage', label: 'Pemakaian' },
  { id: 'data', label: 'Data' },
]

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
  conversations = [],
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
  const [deleteError, setDeleteError] = useState(null)
  const [activeTab, setActiveTab] = useState('account')
  const usage = computeUsage(conversations)
  const todayStart = usage.days.at(-1).date

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

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="announcement-fade fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content aria-describedby={undefined} className="announcement-pop fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl focus:outline-none">
            {/* Header */}
            <div className="relative flex-shrink-0 p-6 sm:p-7 sm:pb-0">
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Tutup"
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
              <div className="space-y-1.5 pr-8">
                <Dialog.Title className="text-xl font-bold tracking-tight text-foreground">
                  Preferensi akun
                </Dialog.Title>
              </div>

              {/* Tabs */}
              <div role="tablist" aria-label="Bagian preferensi" className="mt-5 flex gap-1 rounded-lg bg-muted p-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={activeTab === t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      activeTab === t.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-7 sm:pb-7">
              {activeTab === 'account' && (
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-accent">
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

                  <div className="space-y-1.5">
                    <label htmlFor="prefs-display-name" className="text-sm text-foreground">
                      Nama tampilan
                      <span className="ml-1.5 text-xs text-muted-foreground">nama yang tampil di percakapan</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="prefs-display-name"
                        type="text"
                        maxLength={40}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={user?.name || 'Nama'}
                        className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <Button
                        size="sm"
                        onClick={commitName}
                        disabled={!nameDirty || !nameValid || saving}
                        className="h-9 shrink-0 rounded-lg px-3.5"
                      >
                        {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : nameSaved ? <Check className="h-4 w-4" /> : null}
                        Simpan
                      </Button>
                    </div>
                    {nameSaved && <p className="text-xs text-primary">Nama disimpan</p>}
                    {nameError && <p className="text-xs text-destructive">{nameError}</p>}
                  </div>
                </section>
              )}

              {activeTab === 'prefs' && (
                <section className="space-y-6">
                  <div className="space-y-1.5">
                    <p className="text-sm text-foreground">
                      Model default
                      <span className="ml-1.5 text-xs text-muted-foreground">untuk chat baru di semua perangkat</span>
                    </p>
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => m.id !== model && onUpdatePrefs({ default_model: m.id }).catch(() => {})}
                        disabled={saving}
                        className={`flex w-full items-center justify-between rounded-md px-1 py-2 text-left text-sm transition-colors hover:bg-accent/40 disabled:opacity-60 ${
                          m.id === model ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        <span className="font-medium">{m.label}</span>
                        {m.id === model && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm text-foreground">
                        Lebar sidebar
                        <span className="ml-1.5 text-xs text-muted-foreground">lebar awal di perangkat baru</span>
                      </p>
                      <span className="text-xs tabular-nums text-muted-foreground">{width}px</span>
                    </div>
                    <input
                      type="range"
                      min={SIDEBAR_MIN}
                      max={SIDEBAR_MAX}
                      step={8}
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="w-full accent-primary"
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
              )}

              {activeTab === 'usage' && (
                <section className="space-y-3">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-baseline justify-between pb-2">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Token per hari</p>
                      <p className="text-[11px] text-muted-foreground/70">14 hari terakhir</p>
                    </div>
                    <Suspense fallback={<div className="h-36" />}>
                      <TokenChart days={usage.days} todayStart={todayStart} />
                    </Suspense>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <TokenStat value={usage.todayTokens} label="Token hari ini" />
                    <TokenStat value={usage.estTokens} label="Token total" />
                  </div>
                </section>
              )}

              {activeTab === 'data' && (
                <section className="space-y-1">
                  <button
                    type="button"
                    onClick={onExportAll}
                    className="flex w-full items-center gap-2.5 rounded-md px-1 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent/40"
                  >
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Ekspor semua percakapan
                  </button>

                  <button
                    type="button"
                    onClick={() => { setDeleteError(null); setDeleteConfirm(true) }}
                    className="flex w-full items-center gap-2.5 rounded-md px-1 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    Hapus semua percakapan
                  </button>
                  {deleteDone && <p className="px-1 pb-1 text-xs text-primary">Semua percakapan dihapus.</p>}
                  {deleteError && <p className="px-1 pb-1 text-xs text-destructive">{deleteError}</p>}

                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center gap-2.5 rounded-md px-1 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Keluar
                  </button>
                </section>
              )}
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
