import * as Dialog from '@radix-ui/react-dialog'
import { Heart, X } from 'lucide-react'
import { Button } from './ui/button'
import { CopyButton } from '../lib/copy-button'
import { visibleDonations, DONATION_NOTE } from '../lib/donate'

/**
 * Announcement "sedang dalam pengembangan" + ajakan dukungan/donasi.
 * Muncul sekali per sesi browser (lihat ChatInterface). Baris donasi yang
 * belum diisi disembunyikan otomatis.
 */
export function AnnouncementDialog({ open, onOpenChange }) {
  const items = visibleDonations()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl focus:outline-none">
          <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/40 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
              </span>
              <div className="min-w-0">
                <Dialog.Title className="text-base font-semibold tracking-tight text-foreground">
                  KeyzAI sedang dalam pengembangan
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Fitur masih terus ditambah dan diperbaiki. Kalau KeyzAI membantumu,
                  dukung kami supaya tetap gratis dan makin cepat berkembang.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto p-5">
            {items.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Metode donasi sedang disiapkan. Pantau terus halaman ini!
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((d) => (
                  <div
                    key={d.label}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {d.type}
                      </p>
                      <p className="truncate text-sm font-medium text-foreground">{d.label}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <code className="font-mono text-sm text-foreground">{d.value}</code>
                      <CopyButton text={d.value} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {DONATION_NOTE && (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{DONATION_NOTE}</p>
            )}
          </div>

          <div className="border-t border-border p-4">
            <Dialog.Close asChild>
              <Button className="w-full">Mengerti, lanjut chat</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
