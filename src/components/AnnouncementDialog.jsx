import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { CopyButton } from '../lib/copy-button'
import { visibleDonations, DONATION_NOTE } from '../lib/donate'

/**
 * Announcement + ajakan dukungan/donasi. Muncul sekali per sesi browser
 * (lihat ChatInterface). Baris donasi yang belum diisi disembunyikan otomatis.
 */
export function AnnouncementDialog({ open, onOpenChange }) {
  const items = visibleDonations()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="login-fade fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <Dialog.Content className="tui-panel login-pop relative max-h-[90dvh] w-full max-w-sm overflow-y-auto bg-background px-5 pb-4 pt-5 font-mono shadow-xl focus:outline-none">
          <span className="tui-inset-title" aria-hidden="true">support</span>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Tutup"
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-sm border border-foreground/15 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </Dialog.Close>

          <div className="pr-8">
            <Dialog.Title className="text-sm text-foreground">
              <span className="tui-prompt font-bold" aria-hidden="true">› </span>
              suka keyzai?
            </Dialog.Title>
            <Dialog.Description className="mt-1 font-mono text-xs leading-relaxed text-muted-foreground">
              Masih pengembangan dan gratis. Kalau terbantu, dukung biar tetap jalan.
            </Dialog.Description>
          </div>

          {items.length > 0 && (
            <div className="mt-4 divide-y divide-foreground/10 rounded-sm border border-foreground/10">
              {items.map((d) => (
                <div key={d.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    {d.logo && (
                      <img
                        src={d.logo}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded-sm object-contain"
                        onError={(e) => e.currentTarget.remove()}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{d.label}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{d.type}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <code className="font-mono text-xs text-foreground">{d.value}</code>
                    <CopyButton
                      text={d.value}
                      className="h-6 w-6 items-center justify-center rounded-sm border border-foreground/15 bg-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && !DONATION_NOTE && (
            <p className="mt-4 font-mono text-xs text-muted-foreground">Metode donasi segera hadir.</p>
          )}

          {DONATION_NOTE && (
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">{DONATION_NOTE}</p>
          )}

          <Dialog.Close asChild>
            <button
              type="button"
              className="mx-auto mt-3 block font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              esc / lanjut chat
            </button>
          </Dialog.Close>
        </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
