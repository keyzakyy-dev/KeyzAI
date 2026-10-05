import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Download, LoaderCircle, Trash2, LogOut, X, Check, User } from 'lucide-react'

import { Button } from './ui/button'
import { ConfirmDialog } from './ui/confirm-dialog'
import { MODELS, DEFAULT_MODEL } from '../lib/models'
import { normalizeDisplayName, isValidDisplayName } from '../lib/preferences'
import { computeUsage } from '../lib/usage'
import { useCountUp } from '../lib/micro-anim'

// recharts cukup besar — dimuat saat tab Pemakaian pertama kali dibuka
const TokenChart = lazy(() => import('./token-chart'))

const SIDEBAR_MIN = 220
const SIDEBAR_MAX = 420

const TABS = [
  { id: 'account', label: 'Akun', hint: 'progres hanya di perangkat ini' },
  { id: 'prefs', label: 'Preferensi', hint: 'tersimpan otomatis' },
  { id: 'usage', label: 'Pemakaian', hint: 'estimasi lokal' },
  { id: 'data', label: 'Data', hint: 'ekspor / hapus / keluar' },
]

// Label chrome mono uppercase, gaya yang sama untuk semua subjudul di dialog.
const SUBTITLE = 'font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground'

function TokenStat({ value, label }) {
  const v = useCountUp(value)
  return (
    <div className="bg-background px-3 py-3 text-center">
      <p className="text-lg font-semibold tabular-nums text-foreground">± {v.toLocaleString('id-ID')}</p>
      <p className={`mt-0.5 ${SUBTITLE}`}>{label}</p>
    </div>
  )
}

// Baris aksi pada tab Data: ikon + label mono + petunjuk kanan.
function DataRow({ icon: Icon, label, hint, onClick, danger = false, idle = false }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
          danger
            ? 'text-destructive hover:bg-destructive/10'
            : idle
              ? 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
              : 'text-foreground hover:bg-foreground/5'
        }`}
      >
        <Icon className="size-3.5 shrink-0 opacity-40" />
        <span className="min-w-0 flex-1 truncate font-mono text-xs">{label}</span>
        {hint && <span className="max-w-[45%] shrink-0 truncate font-mono text-[10px] text-muted-foreground/60">{hint}</span>}
        <span className="shrink-0 text-muted-foreground/40" aria-hidden="true">›</span>
      </button>
    </li>
  )
}

// Tab bar: navigasi panah / Home / End, roving tabindex (hanya tab aktif
// yang bisa difokus), sesuai pola tab ARIA.
function TabBar({ active, onChange }) {
  const refs = useRef([])

  const onKeyDown = (e) => {
    const i = TABS.findIndex((t) => t.id === active)
    let next = null
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    if (next === null) return
    e.preventDefault()
    onChange(TABS[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="Bagian preferensi"
      onKeyDown={onKeyDown}
      // gap-px + background container memberi garis pemisah 1px yang sama
      // untuk semua sel (termasuk di sebelah tab aktif), jadi tidak ada
      // garis yang tiba-tiba hilang saat tab berganti.
      //
      // Di bawah sm label ditumpuk 2x2, bukan 4 sejajar: pada 390px tiap sel
      // cuma ~79px, sedangkan "Preferensi" di mono 11px + tracking 0.08em
      // butuh ~83px — jadi labelnya kena truncate. 2 kolom memberi ~140px
      // per sel, cukup sampai layar sangat sempit.
      className="grid grid-cols-2 gap-px border border-foreground/15 bg-foreground/15 sm:flex"
    >
      {TABS.map((t, i) => {
        const on = active === t.id
        return (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el }}
            type="button"
            role="tab"
            id={`prefs-tab-${t.id}`}
            aria-selected={on}
            aria-controls={`prefs-panel-${t.id}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`min-w-0 flex-1 truncate bg-background px-1 py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
              on ? 'tui-tab-active font-semibold' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

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
  // Dialog juga bisa dibuka saat belum masuk (tombol Settings selalu ada),
  // jadi beberapa kontrol harus nonaktif — preferensi hanya tersimpan di
  // server kalau ada session.
  const signedIn = !!user

  const [activeTab, setActiveTab] = useState('account')

  // ---- nama tampilan
  const [name, setName] = useState('')
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState(null)
  const savedTimer = useRef()

  // ---- hapus semua percakapan
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteDone, setDeleteDone] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // ---- lebar sidebar (baris lokal agar slider halus; simpan dengan debounce)
  const [width, setWidth] = useState(prefs.sidebar_width)

  // Reset state sementara tiap kali dialog dibuka.
  //
  // Sengaja hanya bergantung ke [open], bukan juga ke user?.name: nama di
  // server ikut ter-update begitu "Simpan" ditekan, jadi kalau ikut jadi
  // dependensi, efek ini menyala lagi di tengah dialog dan menghapus
  // flag "tersimpan" (belum sempat terlihat) plus tab yang sedang aktif.
  // user?.name dibaca saat efek ini berjalan, jadi nilainya tetap yang
  // terbaru saat dialog dibuka.
  useEffect(() => {
    if (!open) return
    setName(user?.name || '')
    setNameSaved(false)
    setNameError(null)
    setActiveTab('account')
    setDeleteDone(false)
    setDeleteError(null)
  }, [open])

  // Timer "tersimpan" tidak boleh tetap hidup setelah dialog ditutup.
  useEffect(() => () => clearTimeout(savedTimer.current), [])

  useEffect(() => {
    if (open) setWidth(prefs.sidebar_width)
  }, [open, prefs.sidebar_width])
  useEffect(() => {
    if (!open || !signedIn || width === prefs.sidebar_width) return
    const t = setTimeout(() => {
      onUpdatePrefs({ sidebar_width: width }).catch(() => {})
    }, 500)
    return () => clearTimeout(t)
  }, [width, prefs.sidebar_width, open, signedIn, onUpdatePrefs])

  const model = MODELS.some((m) => m.id === prefs.default_model) ? prefs.default_model : DEFAULT_MODEL
  const cleanName = normalizeDisplayName(name)
  const nameDirty = cleanName !== (user?.name || '')
  const nameValid = isValidDisplayName(name)

  const usage = computeUsage(conversations)
  const todayStart = usage.days.at(-1).date
  const tokens = usage.days.map((d) => d.tokens)

  const commitName = async () => {
    if (!nameDirty || !nameValid || saving) return
    setNameError(null)
    try {
      const nextUser = await onSaveDisplayName(name)
      if (nextUser) {
        setNameSaved(true)
        clearTimeout(savedTimer.current)
        savedTimer.current = setTimeout(() => setNameSaved(false), 2000)
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
          <Dialog.Overlay className="login-fade fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          {/* Wrapper flex yang memusatkan panel sebagai popup melayang.
              Sengaja TIDAK memakai left-1/2 + -translate-1/2 di sini: panel
              perlu `overflow` yang bebas supaya chip .tui-inset-title (yang
              menjulang 8px di atas garis panel) tidak ikut terpotong. */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            aria-describedby={undefined}
            className="login-pop tui-panel relative flex max-h-[85dvh] w-full max-w-md flex-col bg-background font-mono shadow-xl focus:outline-none"
          >
            <span className="tui-inset-title" aria-hidden="true">preferensi</span>

            {/* Header */}
            <div className="flex flex-shrink-0 items-start justify-between gap-3 px-5 pb-4 pt-7">
              <div className="min-w-0">
                <Dialog.Title className="flex items-baseline gap-1.5 text-[15px] font-semibold tracking-tight text-foreground">
                  <span className="tui-prompt font-bold" aria-hidden="true">›</span>
                  Preferensi akun
                </Dialog.Title>
                <p className={`mt-1 ${SUBTITLE}`}>tersimpan di server · sinkron lintas perangkat</p>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Tutup"
                  className="flex size-6 shrink-0 items-center justify-center border border-foreground/15 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </Dialog.Close>
            </div>

            {/* Tabs + error global */}
            <div className="flex flex-shrink-0 flex-col gap-3 px-5 pb-4">
              <TabBar active={activeTab} onChange={setActiveTab} />
              {error && (
                <p
                  className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              {activeTab === 'account' && (
                <section
                  role="tabpanel"
                  id="prefs-panel-account"
                  aria-labelledby="prefs-tab-account"
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3 border border-foreground/15 p-3">
                    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden border border-foreground/15 bg-foreground/5">
                      {user?.picture ? (
                        <img
                          src={user.picture}
                          alt=""
                          className="size-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="size-3.5 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-foreground">{user?.name || 'Belum masuk'}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {user?.email || 'progres hanya tersimpan di perangkat ini'}
                      </p>
                    </div>
                    {!signedIn && <span className={`shrink-0 ${SUBTITLE}`}>tamu</span>}
                  </div>

                  <form
                    onSubmit={(e) => { e.preventDefault(); commitName() }}
                    className="space-y-2"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <label htmlFor="prefs-display-name" className={SUBTITLE}>nama tampilan</label>
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
                        {cleanName.length}/40
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        id="prefs-display-name"
                        type="text"
                        maxLength={40}
                        value={name}
                        disabled={!signedIn}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={user?.name || 'Nama'}
                        aria-describedby="prefs-name-hint"
                        className="h-8 min-w-0 flex-1 border border-foreground/15 bg-transparent px-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:border-foreground/50 focus:outline-none disabled:opacity-50"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant={nameDirty && nameValid ? 'default' : 'outline'}
                        disabled={!nameDirty || !nameValid || saving}
                        className={`h-8 shrink-0 gap-1.5 rounded-sm px-3 text-[11px] uppercase tracking-[0.08em] ${
                          nameDirty && nameValid ? 'tui-tab-active font-semibold' : ''
                        }`}
                      >
                        {saving ? (
                          <LoaderCircle className="size-3 animate-spin" />
                        ) : nameSaved ? (
                          <Check className="size-3" />
                        ) : null}
                        Simpan
                      </Button>
                    </div>
                    <p
                      id="prefs-name-hint"
                      aria-live="polite"
                      className={`text-[11px] ${
                        nameError
                          ? 'text-destructive'
                          : nameSaved
                            ? 'tui-accent'
                            : nameDirty
                              ? 'text-foreground/80'
                              : 'text-muted-foreground'
                      }`}
                    >
                      {nameError ||
                        (nameSaved ? 'nama tersimpan' : null) ||
                        (nameDirty
                          ? 'tekan enter atau simpan untuk menerapkan'
                          : 'nama yang tampil di percakapan')}
                    </p>
                  </form>
                </section>
              )}

              {activeTab === 'prefs' && (
                <section
                  role="tabpanel"
                  id="prefs-panel-prefs"
                  aria-labelledby="prefs-tab-prefs"
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={SUBTITLE}>model default</p>
                      <span className="font-mono text-[10px] text-muted-foreground/60">semua gratis</span>
                    </div>
                    <ul role="radiogroup" aria-label="Model default" className="divide-y divide-foreground/10 border border-foreground/15">
                      {MODELS.map((m) => {
                        const on = m.id === model
                        return (
                          <li key={m.id}>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={on}
                              disabled={saving || !signedIn}
                              onClick={() => m.id !== model && onUpdatePrefs({ default_model: m.id }).catch(() => {})}
                              className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors disabled:opacity-50 ${
                                on ? 'bg-foreground/[0.06]' : 'hover:bg-foreground/[0.04]'
                              }`}
                            >
                              <img
                                src={m.logo}
                                alt=""
                                loading="lazy"
                                className="size-5 shrink-0 rounded-sm object-contain"
                                onError={(e) => e.currentTarget.remove()}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] text-foreground">{m.label}</span>
                                <span className="block truncate text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                                  {m.provider} · {m.tagline}
                                </span>
                              </span>
                              {on && <Check className="tui-accent size-3.5 shrink-0" />}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                    <p className="text-[11px] text-muted-foreground">
                      untuk chat baru di semua perangkat.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <label htmlFor="prefs-sidebar-width" className={SUBTITLE}>lebar sidebar</label>
                      <span className="font-mono text-[11px] tabular-nums text-foreground">{width}px</span>
                    </div>
                    <input
                      id="prefs-sidebar-width"
                      type="range"
                      className="prefs-range w-full"
                      min={SIDEBAR_MIN}
                      max={SIDEBAR_MAX}
                      step={8}
                      value={width}
                      disabled={!signedIn}
                      onChange={(e) => setWidth(Number(e.target.value))}
                    />
                    <div className="flex justify-between font-mono text-[10px] text-muted-foreground/60" aria-hidden="true">
                      <span>{SIDEBAR_MIN}px</span>
                      <span>{SIDEBAR_MAX}px</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      lebar awal di perangkat baru; sidebar yang aktif masih bisa di-drag.
                    </p>
                  </div>

                  {!signedIn && (
                    <p className="border border-foreground/15 bg-foreground/5 px-3 py-2 text-[11px] text-muted-foreground">
                      Masuk dulu untuk menyimpan preferensi di akun.
                    </p>
                  )}
                </section>
              )}

              {activeTab === 'usage' && (
                <section
                  role="tabpanel"
                  id="prefs-panel-usage"
                  aria-labelledby="prefs-tab-usage"
                  className="space-y-4"
                >
                  <div className="border border-foreground/15 p-3">
                    <div className="flex items-baseline justify-between pb-2">
                      <p className={SUBTITLE}>token per hari</p>
                      <p className="font-mono text-[10px] text-muted-foreground/60">14 hari terakhir</p>
                    </div>
                    <Suspense fallback={<div className="h-36" />}>
                      <TokenChart days={usage.days} todayStart={todayStart} />
                    </Suspense>
                  </div>
                  {/* gap-px di atas container = garis rambut 1px antar kartu */}
                  <div className="grid grid-cols-2 gap-px border border-foreground/15 bg-foreground/15">
                    <TokenStat value={usage.todayTokens} label="hari ini" />
                    <TokenStat value={usage.estTokens} label="total" />
                    <TokenStat value={Math.round(tokens.reduce((a, b) => a + b, 0) / tokens.length)} label="rata-rata" />
                    <TokenStat value={Math.max(...tokens)} label="puncak" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Estimasi lokal dari isi percakapan (±4 karakter per token), bukan tagihan resmi.
                  </p>
                </section>
              )}

              {activeTab === 'data' && (
                <section
                  role="tabpanel"
                  id="prefs-panel-data"
                  aria-labelledby="prefs-tab-data"
                  className="space-y-3"
                >
                  <p className={SUBTITLE}>data akun</p>
                  <ul className="divide-y divide-foreground/10 border border-foreground/15">
                    <DataRow
                      icon={Download}
                      label="ekspor semua percakapan"
                      hint={signedIn ? 'json' : undefined}
                      onClick={onExportAll}
                    />
                    <DataRow
                      icon={Trash2}
                      label="hapus semua percakapan"
                      hint="permanen"
                      onClick={() => { setDeleteError(null); setDeleteConfirm(true) }}
                      danger
                    />
                    {signedIn && (
                      <DataRow icon={LogOut} label="keluar" onClick={onLogout} idle />
                    )}
                  </ul>
                  {deleteDone && <p className="tui-accent text-[11px]">Semua percakapan dihapus.</p>}
                  {deleteError && <p className="text-[11px] text-destructive">{deleteError}</p>}
                  {signedIn && (
                    <p className="text-[11px] text-muted-foreground">
                      Keluar akan menghapus sesi di perangkat ini. Preferensi tetap tersimpan di akun.
                    </p>
                  )}
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-foreground/10 px-5 py-2.5">
              <span className={`${SUBTITLE} text-muted-foreground/50`}>esc tutup</span>
              <span className="truncate text-[10px] text-muted-foreground/60">
                {TABS.find((t) => t.id === activeTab)?.hint}
              </span>
            </div>
          </Dialog.Content>
          </div>
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
