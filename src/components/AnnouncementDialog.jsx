import * as Dialog from '@radix-ui/react-dialog'
import { Rocket, X, ArrowRight } from 'lucide-react'
import { CopyButton } from '../lib/copy-button'
import { visibleDonations, DONATION_NOTE } from '../lib/donate'

/**
 * Announcement "sedang dalam pengembangan" + ajakan dukungan/donasi.
 * Muncul sekali per sesi browser (lihat ChatInterface). Baris donasi yang
 * belum diisi disembunyikan otomatis. Semua warna memakai token situs
 * (bg-card/border/foreground) — tanpa gradient.
 */
export function AnnouncementDialog({ open, onOpenChange }) {
  const items = visibleDonations()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="announcement-fade fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="announcement-pop fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl focus:outline-none">
          {/* Header: datar, token situs */}
          <div className="relative border-b border-border bg-card p-6 sm:p-8">
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>

            <div className="relative flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-foreground">
                <Rocket className="h-6 w-6" />
              </span>
              <div className="min-w-0 space-y-2 pr-8">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Versi pengembangan
                </span>
                <Dialog.Title className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  KeyzAI belum selesai tumbuh
                </Dialog.Title>
                <Dialog.Description className="text-sm leading-relaxed text-muted-foreground">
                  Fitur masih ditambah dan diperbaiki setiap hari. Kalau KeyzAI sudah
                  membantumu, dukung kami supaya tetap gratis dan makin pintar.
                </Dialog.Description>
              </div>
            </div>
          </div>

          {/* Body: daftar donasi */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Dukung via
            </h3>

            {items.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-8 text-center">
                <p className="text-sm font-medium text-foreground">Metode donasi sedang disiapkan</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Kami sedang menata rekening, e-wallet, dan QRIS. Pantau terus!
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {items.map((d) => (
                  <div
                    key={d.label}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/30"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {d.type}
                      </p>
                      <p className="truncate text-sm font-semibold text-foreground">{d.label}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <code className="font-mono text-sm text-foreground">{d.value}</code>
                      <CopyButton
                        text={d.value}
                        className="h-7 w-7 items-center justify-center rounded-md border border-border bg-background"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {DONATION_NOTE && (
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                {DONATION_NOTE}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 border-t border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="hidden text-xs text-muted-foreground sm:block">
              Apapun bantuannya, kami sangat berterima kasih.
            </p>
            <Dialog.Close asChild>
              <button
                type="button"
                className="group inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Lanjut chat
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
