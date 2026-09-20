import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { CopyButton } from '../lib/copy-button'
import { visibleDonations, DONATION_NOTE } from '../lib/donate'
import { LogoImg } from '../lib/logo-img'

/**
 * Announcement + ajakan dukungan/donasi. Muncul sekali per sesi browser
 * (lihat ChatInterface). Baris donasi yang belum diisi disembunyikan otomatis.
 */
export function AnnouncementDialog({ open, onOpenChange }) {
  const items = visibleDonations()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="announcement-fade fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="announcement-pop fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-xl focus:outline-none sm:p-7">
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
            <LogoImg className="h-7 w-auto" />
            <Dialog.Title className="pt-1 text-xl font-bold tracking-tight text-foreground">
              Suka KeyzAI?
            </Dialog.Title>
            <Dialog.Description className="text-sm leading-relaxed text-muted-foreground">
              Masih versi pengembangan dan gratis. Kalau membantumu, dukung biar tetap jalan.
            </Dialog.Description>
          </div>

          {items.length > 0 && (
            <div className="mt-5 divide-y divide-border rounded-xl border border-border">
              {items.map((d) => (
                <div key={d.label} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {d.logo && (
                      <img
                        src={d.logo}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded object-contain"
                        onError={(e) => e.currentTarget.remove()}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{d.label}</p>
                      <p className="text-[11px] text-muted-foreground">{d.type}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <code className="font-mono text-sm text-foreground">{d.value}</code>
                    <CopyButton
                      text={d.value}
                      className="h-7 w-7 items-center justify-center rounded-md border border-border bg-card"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && !DONATION_NOTE && (
            <p className="mt-5 text-sm text-muted-foreground">Metode donasi segera hadir.</p>
          )}

          {DONATION_NOTE && (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{DONATION_NOTE}</p>
          )}

          <Dialog.Close asChild>
            <button
              type="button"
              className="mx-auto mt-6 block rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Lanjut chat
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
