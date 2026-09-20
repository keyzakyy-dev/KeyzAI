import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { History, FileText, Trash2, User } from 'lucide-react'

import { Button } from '../ui/button'

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

/**
 * Dialog riwayat PRD per akun (sama sekali jendela dengan percakapan):
 * list ringan, klik buka project, hapus dengan konfirmasi. Saat belum login
 * menampilkan project lokal saja (usePrdProject sudah jaga fallback-nya).
 */
export function PrdHistoryDialog({ open, onOpenChange, items, currentId, isAuthenticated, onLogin, onSelect, onDelete, onRefresh }) {
  useEffect(() => {
    if (open && onRefresh) onRefresh().catch(() => {})
  }, [open, onRefresh])

  const sorted = [...(items || [])].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  const grouped = GROUPS.map((label) => ({
    label,
    items: sorted.filter((m) => groupKey(m.updatedAt || m.createdAt) === label),
  })).filter((g) => g.items.length > 0)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
            <History className="h-4 w-4" />
            Riwayat PRD
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-muted-foreground">
            {isAuthenticated ? 'Tersimpan di akun Google kamu' : 'Hanya tersimpan di perangkat ini'}
          </Dialog.Description>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="px-2 py-8 text-center">
                <p className="text-sm font-medium text-muted-foreground">Belum ada PRD</p>
                {!isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false)
                      onLogin?.()
                    }}
                    className="mx-auto mt-3 flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    <User className="h-3.5 w-3.5" />
                    Masuk untuk menyimpan riwayat
                  </button>
                ) : (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground/60">
                    Mulai dari ide di halaman ini.
                  </p>
                )}
              </div>
            ) : (
              grouped.map((g) => (
                <div key={g.label} className="mt-3 first:mt-0">
                  <p className="pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    {g.label}
                  </p>
                  <div className="space-y-0.5">
                    {g.items.map((m) => (
                      <div
                        key={m.id}
                        className={`group flex items-center gap-1 rounded-md pr-1 text-sm transition-colors ${
                          currentId === m.id
                            ? 'bg-accent/70 text-foreground'
                            : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
                        }`}
                      >
                        <button
                          onClick={() => {
                            onOpenChange(false)
                            onSelect(m.id)
                          }}
                          className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-1.5 text-left"
                          title={m.projectName || undefined}
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0 opacity-35" />
                          <span className="min-w-0 flex-1 truncate">
                            {m.projectName || 'PRD tanpa judul'}
                          </span>
                        </button>
                        <button
                          onClick={() => onDelete(m.id)}
                          className="rounded-md p-1 text-muted-foreground transition-opacity hover:text-destructive focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                          aria-label="Hapus PRD"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">
                Tutup
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
