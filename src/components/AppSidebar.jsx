import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { MeshCanvas } from './MeshCanvas'
import { AnnouncementDialog } from './AnnouncementDialog'
import { ConfirmDialog } from './ui/confirm-dialog'
import { PreferencesDialog } from './PreferencesDialog'
import { LoginDialog } from './LoginDialog'
import { X, ArrowDown, PanelRight, Plus, FileText, MessageSquare, Trash2, User } from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import { useChatStore } from '../hooks/useChatStore'
import { usePrdHistory } from '../hooks/usePrdHistory'
import { usePreferences } from '../hooks/usePreferences'
import { useToast } from '../hooks/useToast'
import { MODELS } from '../lib/models'
import { Wordmark } from '../lib/logo-img'
import { deleteAllConversations } from '../lib/sync'
import { downloadAll } from '../lib/backup'
import { serializeConv } from '../state/tree'

/**
 * Layout halaman non-chat (PRD Builder) dengan kerangka yang sama persis
 * seperti /chat: kolom main (header panel + output panel + panel aksi) +
 * aside kanan (panel project + tab menu/recent/account) + strip status
 * full-width + MeshCanvas sebagai latar.
 *
 * Potongan konten disuplai halaman via slot: `header`, `panelTitle`,
 * `stepper`, `children` (isi scroll output), `actionBar`, `statusBar`,
 * dan `projectMeta` untuk panel project di aside.
 */
export function AppSidebar({
  header,
  panelTitle = 'prd',
  stepper = null,
  children,
  actionBar = null,
  statusBar = null,
  projectMeta = {},
  currentPrdId,
  onAfterDeletePrd,
  onNewPrd,
  footer,
}) {
  const { state, dispatch, refreshHistory, logoutReset, authExpired, ackAuthExpired } = useChatStore()
  const { history: prdItems, remove: removePrd, refresh: refreshPrd } = usePrdHistory()
  const { user, logout, loginWithGoogle, updateUser } = useAuth()
  const { toast, notify, dismiss } = useToast()

  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(null)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginErr, setLoginErr] = useState(null)
  // Tab panel kanan (menu / recent / account), meniru halaman chat.
  const [panelTab, setPanelTab] = useState('menu')
  // Aside jadi drawer di mobile agar kolom konten tidak tertutup.
  const [panelOpen, setPanelOpen] = useState(false)
  // Announcement "sedang dalam pengembangan": sekali per sesi browser
  // (kunci sessionStorage yang sama dengan /chat).
  const [announceOpen, setAnnounceOpen] = useState(() => {
    try {
      return sessionStorage.getItem('keyzai-announced') !== '1'
    } catch {
      return false
    }
  })
  // Posisi scroll kanvas output untuk tombol gulir-ke-bawah.
  const scrollAreaRef = useRef(null)
  const [atBottom, setAtBottom] = useState(true)

  const { prefs, saving, error: prefsError, refresh: refreshPrefs, update: updatePrefs, saveDisplayName, reset: resetPrefs } =
    usePreferences({})

  // Sesi kedaluwarsa (401 dari API): bersihkan tampilan + minta login ulang.
  useEffect(() => {
    if (!authExpired) return
    ackAuthExpired()
    logoutReset()
    setLoginErr('Sesi berakhir. Silakan masuk kembali.')
    setLoginOpen(true)
  }, [authExpired, ackAuthExpired, logoutReset])

  // ---------- login / logout
  const handleLoginToken = async (idToken) => {
    setLoginErr(null)
    setLoginLoading(true)
    try {
      await loginWithGoogle(idToken)
      refreshPrefs()
      refreshPrd().catch(() => {})
      refreshHistory(true)
      setLoginOpen(false)
    } catch (e) {
      setLoginErr(e.message || 'Login gagal')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    logoutReset()
    resetPrefs()
    navigate('/', { replace: true })
  }

  // ---------- riwayat PRD
  const handleSelectPrd = (projectId) => {
    navigate(`/prd-builder/${projectId}`)
    setPanelOpen(false)
  }

  const handleDeletePrd = (projectId) => {
    const meta = prdItems.find((m) => m.id === projectId)
    setConfirm({
      title: 'Hapus PRD ini?',
      description: `"${meta?.projectName || 'PRD tanpa judul'}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus',
      danger: true,
      onConfirm: () => {
        removePrd(projectId)
        notify(`"${meta?.projectName || 'PRD'}" dihapus`)
        onAfterDeletePrd?.(projectId)
      },
    })
  }

  // ---------- preferensi akun
  const handlePrefsSaveDisplayName = async (rawName) => {
    const nextUser = await saveDisplayName(rawName)
    if (nextUser) updateUser(nextUser)
    return nextUser
  }

  const handlePrefsDeleteAll = async () => {
    await deleteAllConversations()
    dispatch({ type: 'CLEAR_ALL' })
    notify('Semua percakapan dihapus')
  }

  const handleExportAll = () => downloadAll(state.convs.map(serializeConv))

  const closeAnnounce = (open) => {
    setAnnounceOpen(open)
    if (!open) {
      try {
        sessionStorage.setItem('keyzai-announced', '1')
      } catch {
        // sessionStorage unavailable (private mode) — popup tidak akan ulang sesi ini
      }
    }
  }

  const scrollToBottom = () => {
    const el = scrollAreaRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  const handleScroll = () => {
    const el = scrollAreaRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 150)
  }

  // ---------- panel project (cermin panel session di /chat)
  const stepIndex = projectMeta.stepIndex ?? 0
  const totalSteps = projectMeta.totalSteps ?? 5
  const working = !!projectMeta.isWorking
  const progressPct = Math.min(99, Math.round(((stepIndex + 1) / totalSteps) * 100))
  const progressFilled = Math.min(20, Math.round(((stepIndex + 1) / totalSteps) * 20))
  const modelMeta = MODELS.find((m) => m.id === projectMeta.modelId) || null
  const sortedPrd = [...(prdItems || [])].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

  return (
    <div className="tui-root prd-mesh relative grid h-dvh grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden bg-background p-3 text-foreground lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[minmax(0,1fr)_auto]">
      {/* Mesh latar seperti halaman chat: di atas background root,
          di bawah konten, non-interaktif. */}
      <MeshCanvas
        label="Decorative animated network mesh background."
        className="pointer-events-none absolute inset-0 h-full w-full"
        strength={1.5}
        density={1.15}
      />
      <main className="flex min-h-0 min-w-0 flex-col gap-3 lg:h-full lg:min-h-0">
        <div className="tui-panel relative z-20 flex h-10 flex-shrink-0 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <Wordmark className="text-base shrink-0" />
            <span className="shrink-0 select-none text-muted-foreground/50" aria-hidden="true">·</span>
            {header}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 text-xs">
            {user && (
              <>
                <span className="min-w-0 max-w-24 truncate text-muted-foreground">{user.name}</span>
                <span className="shrink-0 select-none text-muted-foreground/50" aria-hidden="true">·</span>
              </>
            )}
            <button type="button" onClick={onNewPrd} aria-label="PRD baru" className="flex h-6 w-6 items-center justify-center border border-foreground/15 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
              <Plus className="h-3 w-3" />
            </button>
            <button type="button" onClick={() => setPrefsOpen(true)} aria-label="Pengaturan" className="text-muted-foreground transition-colors hover:text-foreground">
              Settings
            </button>
            <button type="button" onClick={() => setPanelOpen((o) => !o)} aria-label="Buka/tutup panel" aria-expanded={panelOpen} className="flex h-6 w-6 items-center justify-center border border-foreground/15 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground lg:hidden">
              <PanelRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="tui-panel relative flex min-h-0 flex-1 flex-col">
          <span className="tui-inset-title" aria-hidden="true">{panelTitle}</span>
          {stepper && (
            <div className="flex-shrink-0 px-4 pt-5 sm:px-6">
              {stepper}
            </div>
          )}
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6"
          >
            {children}
          </div>

          {!atBottom && (
            <button
              onClick={() => {
                setAtBottom(true)
                scrollToBottom()
              }}
              aria-label="Gulir ke bawah"
              className="absolute bottom-4 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-sm border border-foreground/25 bg-background text-foreground transition-colors hover:border-foreground/40"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          )}
        </div>

        {actionBar && (
          <div className={`tui-panel relative flex-shrink-0 px-3 pb-2 pt-3 ${working ? 'tui-queued' : ''}`}>
            <span className={`tui-inset-title ${working ? 'tui-inset-accent' : ''}`} aria-hidden="true">{working ? 'queued' : 'input'}</span>
            {actionBar}
          </div>
        )}
      </main>

      {statusBar}

      {/* Footer: peringatan & kredit — tampil di semua halaman yang pakai AppSidebar. */}
      {footer && (
        <div className="flex flex-shrink-0 items-center justify-between gap-3 px-1 py-1.5 text-[10px] leading-none text-muted-foreground/70">
          <span className="hidden sm:block">{footer}</span>
          <span className="sm:hidden">{footer}</span>
          <a
            href="https://github.com/keyzakyy-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 transition-colors hover:text-foreground"
          >
            by Keyzakyy.
          </a>
        </div>
      )}

      {panelOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setPanelOpen(false)} aria-hidden="true" />
      )}
      <aside className={`min-w-0 flex-col gap-3 border-l border-foreground/10 bg-background p-3 transition-transform duration-300 fixed right-0 top-0 z-40 flex h-dvh w-[340px] max-w-[88vw] overflow-y-auto ${panelOpen ? 'translate-x-0' : 'translate-x-full'} lg:static lg:z-auto lg:flex lg:h-full lg:w-auto lg:max-w-none lg:translate-x-0 lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:row-start-1 lg:col-start-2`} aria-label="Panel info">
        <section className="tui-panel relative shrink-0 px-4 pb-5 pt-6 text-xs leading-relaxed" aria-label="Project">
          <span className="tui-inset-title" aria-hidden="true">project</span>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            <dt className="text-muted-foreground">tahap</dt>
            <dd className="truncate text-right"><span className="tui-accent font-bold">~{progressPct}%</span> <span className="hidden text-muted-foreground/40 min-[420px]:inline">{'▓'.repeat(progressFilled)}{'░'.repeat(20 - progressFilled)}</span></dd>
            <dt className="text-muted-foreground">langkah</dt>
            <dd className="text-right text-foreground tabular-nums">{stepIndex + 1} / {totalSteps}</dd>
            <dt className="text-muted-foreground">status</dt>
            <dd className="text-right text-foreground">{working ? 'working' : 'idle'}</dd>
            <dt className="text-muted-foreground">model</dt>
            <dd className="truncate text-right text-foreground">{modelMeta ? modelMeta.label : (projectMeta.modelId || '—')}</dd>
            <dt className="text-muted-foreground">prd</dt>
            <dd className="text-right text-foreground tabular-nums">{prdItems.length}</dd>
          </dl>
        </section>

        <section className="tui-panel relative flex min-h-[24dvh] flex-col px-4 pb-5 pt-6 text-xs leading-relaxed lg:min-h-0 lg:flex-1" aria-label="Panel menu">
          <nav className="tui-inset-title" aria-label="Navigasi panel">
            <button type="button" onClick={() => setPanelTab('menu')} aria-selected={panelTab === 'menu'} role="tab" className={panelTab === 'menu' ? 'tui-accent font-bold transition-opacity hover:opacity-70' : 'transition-colors hover:text-foreground'}>menu</button>
            <span aria-hidden="true"> · </span>
            <button type="button" onClick={() => setPanelTab('recent')} aria-selected={panelTab === 'recent'} role="tab" className={panelTab === 'recent' ? 'tui-accent font-bold transition-opacity hover:opacity-70' : 'transition-colors hover:text-foreground'}>recent</button>
            <span aria-hidden="true"> · </span>
            <button type="button" onClick={() => setPanelTab('account')} aria-selected={panelTab === 'account'} role="tab" className={panelTab === 'account' ? 'tui-accent font-bold transition-opacity hover:opacity-70' : 'transition-colors hover:text-foreground'}>account</button>
          </nav>
          <div className="border-b border-foreground/10 pb-4">
            <p className="text-muted-foreground">{working ? (projectMeta.statusText || 'bekerja…') : 'idle · siap menerima perintah'}</p>
            <p className="mt-1 truncate text-foreground">PRD Builder <span className="tui-accent font-semibold">›{projectMeta.name || 'baru'}</span></p>
          </div>
          <div className="min-h-0 pt-4">
            {panelTab === 'menu' && (
              <div>
                <p className="font-bold uppercase tracking-wider text-muted-foreground">menu</p>
                <div className="mt-1 space-y-0.5">
                  <button type="button" onClick={onNewPrd} className="flex w-full items-center gap-2 px-1 py-1 text-left text-foreground/80 transition-colors hover:text-foreground">
                    <Plus className="h-3 w-3 shrink-0 opacity-40" /> PRD baru
                  </button>
                  <button type="button" onClick={() => navigate('/chat')} className="flex w-full items-center gap-2 px-1 py-1 text-left text-foreground/80 transition-colors hover:text-foreground">
                    <MessageSquare className="h-3 w-3 shrink-0 opacity-40" /> Chat
                  </button>
                </div>
              </div>
            )}
            {panelTab === 'recent' && (
              <div>
                <p className="font-bold uppercase tracking-wider text-muted-foreground">recent</p>
                {sortedPrd.length === 0 ? (
                  <div className="mt-1">
                    <p className="text-foreground">Belum ada PRD</p>
                    <p className="text-muted-foreground/70">Buka tab menu, tekan “PRD baru”.</p>
                  </div>
                ) : (
                  <ul className="mt-1 max-h-64 space-y-0.5 overflow-y-auto">
                    {sortedPrd.map((m) => (
                      <li key={m.id} className={`group flex items-center gap-1 ${currentPrdId === m.id ? 'tui-row-active' : ''}`}>
                        <button type="button" onClick={() => handleSelectPrd(m.id)} title={m.projectName || undefined} className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-left text-foreground/80 transition-colors hover:text-foreground">
                          <FileText className="h-3 w-3 shrink-0 opacity-40" />
                          <span className="min-w-0 flex-1 truncate">{m.projectName || 'PRD tanpa judul'}</span>
                        </button>
                        <button type="button" onClick={() => handleDeletePrd(m.id)} aria-label="Hapus PRD" className="shrink-0 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 max-lg:opacity-100">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {panelTab === 'account' && (
              <div>
                <p className="font-bold uppercase tracking-wider text-muted-foreground">account</p>
                {!user ? (
                  <button type="button" onClick={() => { setLoginErr(null); setLoginOpen(true) }} className="mt-1 flex w-full items-center gap-2 px-1 py-1 text-left transition-colors hover:text-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-dashed border-foreground/25 text-muted-foreground">
                      <User className="h-3 w-3" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">Masuk</span>
                      <span className="block truncate text-muted-foreground/70">Progres belum tersimpan</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground/60" aria-hidden="true">›</span>
                  </button>
                ) : (
                  <button type="button" onClick={() => setPrefsOpen(true)} className="mt-1 flex w-full items-center gap-2 px-1 py-1 text-left transition-colors hover:text-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden border border-foreground/20 text-foreground">
                      {user.picture ? (
                        <img src={user.picture} alt={user.name || 'Akun'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-[11px] font-semibold">{(user.name || user.email || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">{user.name || 'Pengguna'}</span>
                      {user.email && <span className="block truncate text-muted-foreground/70">{user.email}</span>}
                    </span>
                    <span className="shrink-0 text-muted-foreground/60" aria-hidden="true">›</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

      </aside>

      <PreferencesDialog
        open={prefsOpen}
        onOpenChange={setPrefsOpen}
        user={user}
        prefs={prefs}
        saving={saving}
        error={prefsError}
        conversations={state.convs}
        onSaveDisplayName={handlePrefsSaveDisplayName}
        onUpdatePrefs={updatePrefs}
        onDeleteAll={handlePrefsDeleteAll}
        onExportAll={handleExportAll}
        onLogout={handleLogout}
      />
      <LoginDialog
        open={loginOpen}
        onOpenChange={(o) => {
          setLoginOpen(o)
          if (!o) setLoginErr(null)
        }}
        onIdToken={handleLoginToken}
        loading={loginLoading}
        error={loginErr}
        reason="manual"
      />
      <AnnouncementDialog open={announceOpen} onOpenChange={closeAnnounce} />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={confirm?.onConfirm}
      />

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 sm:bottom-24">
          <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full border border-border bg-popover px-4 py-2 shadow-lg animate-fade-up" style={{ animationDuration: '220ms' }}>
            <p className="truncate text-sm text-foreground">{toast.label}</p>
            {toast.undo && (
              <button
                type="button"
                onClick={() => { toast.undo(); dismiss() }}
                className="shrink-0 text-sm font-medium text-primary hover:underline"
              >
                Urungkan
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Tutup notifikasi"
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
