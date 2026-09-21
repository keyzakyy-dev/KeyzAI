import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Sidebar } from './Sidebar'
import { ConfirmDialog } from './ui/confirm-dialog'
import { PreferencesDialog } from './PreferencesDialog'
import { LoginDialog } from './LoginDialog'
import { X } from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import { useChatStore } from '../hooks/useChatStore'
import { usePrdHistory } from '../hooks/usePrdHistory'
import { usePreferences } from '../hooks/usePreferences'
import { useResizableSidebar } from '../hooks/useResizableSidebar'
import { useToast } from '../hooks/useToast'
import { deleteAllConversations, removeConversation } from '../lib/sync'
import { downloadAll } from '../lib/backup'
import { serializeConv } from '../state/tree'

/**
 * Layout sidebar untuk halaman non-chat (mis. PRD Builder): percakapan + riwayat
 * PRD dengan interaksi persis seperti di /chat — pilih, baru, hapus (konfirmasi
 * + undo), preferensi akun, dan login. Halaman cukup memberikan header & isi
 * sebagai children; status collapse/mobile dimiliki halaman.
 */
export function AppSidebar({ children, collapsed, mobileOpen, onMobileClose, showConversations = true, currentPrdId, onAfterDeletePrd, onNewPrd }) {
  const { state, dispatch, refreshHistory, logoutReset, authExpired, ackAuthExpired } = useChatStore()
  const { history: prdItems, remove: removePrd, refresh: refreshPrd } = usePrdHistory()
  const { user, logout, loginWithGoogle, updateUser } = useAuth()
  const { toast, notify, dismiss } = useToast()
  const { width: sidebarW, resizing, onDragStart, setWidth, hasStoredWidth } = useResizableSidebar()

  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(null)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginErr, setLoginErr] = useState(null)

  const { prefs, saving, error: prefsError, refresh: refreshPrefs, update: updatePrefs, saveDisplayName, reset: resetPrefs } =
    usePreferences({ onHydrated: (p) => { if (!hasStoredWidth()) setWidth(p.sidebar_width) } })

  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Sesi kedaluwarsa (401 dari API): bersihkan tampilan + minta login ulang.
  useEffect(() => {
    if (!authExpired) return
    ackAuthExpired()
    logoutReset()
    setLoginErr('Sesi berakhir. Silakan masuk kembali.')
    setLoginOpen(true)
  }, [authExpired, ackAuthExpired, logoutReset])

  // ---------- login / logout (dari footer sidebar)
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

  // ---------- percakapan
  const handleSelectConv = (convId) => {
    navigate(`/chat/${convId}`)
    onMobileClose()
  }

  const handleNewChat = () => {
    try {
      // ChatInterface mengonsumsi flag ini saat mount → mulai di chat baru.
      sessionStorage.setItem('keyzai-fresh-chat', '1')
    } catch {
      // sessionStorage unavailable — ganti halaman saja
    }
    navigate('/chat')
    onMobileClose()
  }

  const handleDeleteConv = (convId) => {
    const conv = state.convs.find((c) => c.id === convId)
    setConfirm({
      title: 'Hapus percakapan ini?',
      description: `"${conv?.title || 'Percakapan ini'}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus',
      danger: true,
      onConfirm: () => {
        const removed = stateRef.current.convs.filter((c) => c.id === convId)
        dispatch({ type: 'DELETE_CONV', convId })
        removeConversation(convId).catch(() => {})
        notify(`"${conv?.title || 'Percakapan'}" dihapus`, () => {
          dispatch({ type: 'RESTORE', convs: removed, activeId: convId })
        })
      },
    })
  }

  // ---------- riwayat PRD
  const handleSelectPrd = (projectId) => {
    navigate(`/prd-builder/${projectId}`)
    onMobileClose()
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

  return (
    <div className="flex h-dvh bg-background text-foreground" style={{ '--sidebar-w': `${sidebarW}px` }}>
      <Sidebar
        conversations={state.convs}
        currentId={state.activeId}
        onSelect={handleSelectConv}
        onNew={handleNewChat}
        onNewPrd={onNewPrd}
        onDelete={handleDeleteConv}
        showConversations={showConversations}
        prdItems={prdItems}
        currentPrdId={currentPrdId}
        onSelectPrd={handleSelectPrd}
        onDeletePrd={handleDeletePrd}
        open={mobileOpen}
        onClose={onMobileClose}
        collapsed={collapsed}
        onDragStart={onDragStart}
        user={user}
        onLogin={() => { setLoginErr(null); setLoginOpen(true) }}
        onOpenSettings={() => setPrefsOpen(true)}
      />
      <main className={`flex min-w-0 flex-1 flex-col ${collapsed || resizing ? '' : 'transition-[margin] duration-300'} ${collapsed ? '' : 'lg:ml-[var(--sidebar-w)]'}`}>
        {children}
      </main>

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
      />
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
