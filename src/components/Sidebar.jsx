import { Link } from 'react-router-dom'
import { Plus, MessageSquare, Pin, Trash2, User, Settings, ChevronRight, FileText } from 'lucide-react'

import { Button } from './ui/button'
import { LogoImg } from '../lib/logo-img'

const GROUPS = ['Hari ini', 'Kemarin', '7 hari terakhir', 'Lebih lama']

function groupKey(ts) {
  if (!ts) return 'Lebih lama'
  const d = new Date(ts)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const days = Math.round((today - thatDay) / 86400000)
  if (days <= 0) return 'Hari ini'
  if (days === 1) return 'Kemarin'
  if (days < 7) return '7 hari terakhir'
  return 'Lebih lama'
}

export function Sidebar({ conversations, currentId, onSelect, onNew, onNewPrd, onDelete, showConversations = true, prdItems, currentPrdId, onSelectPrd, onDeletePrd, open, onClose, collapsed, onDragStart, user, onLogin, onOpenSettings }) {
  // Urut + grouping pakai aktivitas terakhir (updatedAt); fallback createdAt.
  const sortKey = (c) => c.updatedAt ?? c.createdAt ?? 0
  const sorted = [...conversations].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || sortKey(b) - sortKey(a)
  )
  const grouped = GROUPS.map((label) => ({
    label,
    items: sorted.filter((c) => groupKey(sortKey(c)) === label),
  })).filter((g) => g.items.length > 0)

  // Riwayat PRD: urut + grouping sama seperti conversations.
  const sortedPrd = [...(prdItems || [])].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  const groupedPrd = GROUPS.map((label) => ({
    label,
    items: sortedPrd.filter((m) => groupKey(m.updatedAt || m.createdAt) === label),
  })).filter((g) => g.items.length > 0)

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-dvh w-64 flex-col border-r border-border bg-background transition-transform duration-300 lg:w-[var(--sidebar-w)] ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0'}`}
      >
        {/* Resize handle (desktop) */}
        {onDragStart && (
          <div
            onPointerDown={onDragStart}
            aria-hidden="true"
            className="absolute -right-1 top-0 z-50 hidden h-full w-2 cursor-col-resize transition-colors hover:bg-foreground/10 lg:block"
          />
        )}
        {/* Brand */}
        <div className="flex h-14 flex-shrink-0 items-center px-4">
          <Link to="/" aria-label="Kembali ke beranda" className="rounded-xl transition-opacity hover:opacity-80">
            <LogoImg className="h-9 w-auto" />
          </Link>
        </div>

        {/* New Chat / New PRD (PRD Builder) */}
        <div className="space-y-1 px-2">
          <Button
            onClick={onNewPrd || onNew}
            variant="ghost"
            className="h-8 w-full justify-start gap-2 px-3 font-medium text-muted-foreground hover:text-foreground"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/70 bg-foreground/5">
              <Plus />
            </span>
            {onNewPrd ? 'PRD baru' : 'Chat baru'}
          </Button>
          {onNewPrd && (
            <Button asChild variant="ghost" className="h-8 w-full justify-start gap-2 px-3 font-medium text-muted-foreground hover:text-foreground">
              <Link to="/chat">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/70 bg-foreground/5">
                  <MessageSquare className="h-3.5 w-3.5" />
                </span>
                Chat
              </Link>
            </Button>
          )}
          {!onNewPrd && (
            <Button asChild variant="ghost" className="h-8 w-full justify-start gap-2 px-3 font-medium text-muted-foreground hover:text-foreground">
              <Link to="/prd-builder">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/70 bg-foreground/5">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                PRD Builder
                <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-1.5 py-px text-[9px] font-semibold text-primary">
                  Baru
                </span>
              </Link>
            </Button>
          )}
        </div>

        {/* Conversations + Riwayat PRD */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {sortedPrd.length === 0 && conversations.length === 0 ? (
            <div className="px-3 pt-10 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {showConversations ? 'Belum ada percakapan' : 'Belum ada PRD'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground/60">
                {showConversations ? 'Mulai lewat “Chat baru” di atas.' : 'Mulai dari ide di halaman ini.'}
              </p>
            </div>
          ) : (
            <>
              {showConversations &&
                grouped.map((g) => (
                <div key={g.label} className="mt-4">
                  <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">{g.label}</p>
                  <div className="space-y-0.5">
                    {g.items.map((conv) => (
                      <div
                        key={conv.id}
                        className={`group flex items-center gap-1 rounded-md pr-1 text-sm transition-colors ${
                          currentId === conv.id
                            ? 'bg-accent/70 text-foreground'
                            : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
                        }`}
                      >
                        <button
                          onClick={() => onSelect(conv.id)}
                          className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-1.5 text-left"
                          title={conv.title || undefined}
                        >
                          {conv.pinned ? (
                            <Pin className="h-3 w-3 shrink-0 fill-primary/90" />
                          ) : (
                            <MessageSquare className="h-3 w-3 shrink-0 opacity-35" />
                          )}
                          {conv.titlePending ? (
                            <span className="my-1 block h-3 w-24 animate-pulse rounded-full bg-muted-foreground/20" />
                          ) : (
                            <span className="min-w-0 flex-1 truncate">{conv.title}</span>
                          )}
                        </button>
                        <button
                          onClick={() => onDelete(conv.id)}
                          className="rounded-md p-1 text-muted-foreground opacity-100 transition-opacity hover:text-destructive focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                          aria-label="Hapus percakapan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {groupedPrd.length > 0 && (
                <div className="mt-5">
                  <p className="flex items-center gap-1.5 px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    <FileText className="h-3 w-3" />
                    PRD
                  </p>
                  <div className="space-y-0.5">
                    {groupedPrd.map((g) => (
                      <div key={g.label}>
                        {groupedPrd.length > 1 && (
                          <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                            {g.label}
                          </p>
                        )}
                        {g.items.map((m) => (
                          <div
                            key={m.id}
                            className={`group flex items-center gap-1 rounded-md pr-1 text-sm transition-colors ${
                              currentPrdId === m.id
                                ? 'bg-accent/70 text-foreground'
                                : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
                            }`}
                          >
                            <button
                              onClick={() => onSelectPrd(m.id)}
                              className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-1.5 text-left"
                              title={m.projectName || undefined}
                            >
                              <FileText className="h-3 w-3 shrink-0 opacity-35" />
                              <span className="min-w-0 flex-1 truncate">{m.projectName || 'PRD tanpa judul'}</span>
                            </button>
                            <button
                              onClick={() => onDeletePrd(m.id)}
                              className="rounded-md p-1 text-muted-foreground opacity-100 transition-opacity hover:text-destructive focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                              aria-label="Hapus PRD"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="space-y-0.5 border-t border-border p-2">
          {!user ? (
            <button
              type="button"
              onClick={onLogin}
              title="Masuk untuk menyimpan riwayat"
              className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/40"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">Masuk</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  Riwayat belum tersimpan
                </span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSettings}
              title="Preferensi akun"
              className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/40"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-accent">
                {user.picture ? (
                  <img src={user.picture} alt={user.name || 'Akun'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xs font-medium text-foreground">
                    {(user.name || user.email || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{user.name || 'Pengguna'}</span>
                  {user.email && <span className="block truncate text-[11px] text-muted-foreground">{user.email}</span>}
                </span>
                <Settings className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}
