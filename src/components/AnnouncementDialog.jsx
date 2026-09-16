import * as Dialog from '@radix-ui/react-dialog'
import { Rocket, X, Copy, Check, Heart, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { copyText } from '../lib/copy-button'
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
        <Dialog.Overlay className="announcement-fade fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="announcement-pop fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl focus:outline-none">
          {/* Header: gradient hangat + glow */}
          <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-transparent p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>

            <div className="relative flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/25">
                <Rocket className="h-6 w-6" />
              </span>
              <div className="min-w-0 space-y-1.5 pr-8">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Versi pengembangan
                </span>
                <Dialog.Title className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  KeyzAI belum selesai tumbuh
                </Dialog.Title>
                <Dialog.Description className="text-sm leading-relaxed text-muted-foreground">
                  Fitur masih ditambah dan diperbaiki setiap hari. Kalau KeyzAI sudah membantumu,
                  dukung kami supaya tetap gratis dan makin pintar.
                </Dialog.Description>
              </div>
            </div>
          </div>

          {/* Body: dukungan + donasi */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Dukung KeyzAI
              </h3>
            </div>

            {items.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-8 text-center">
                <p className="text-sm font-medium text-foreground">Metode donasi sedang disiapkan</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Kami sedang menata rekening, e-wallet, dan QRIS. Pantau terus!
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {items.map((d) => (
                  <DonationRow key={d.label} item={d} />
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
          <div className="flex flex-col gap-2.5 border-t border-border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="hidden text-xs text-muted-foreground sm:block">
              Apapun bantuannya, kami sangat berterima kasih.
            </p>
            <Dialog.Close asChild>
              <button
                type="button"
                className="group inline-flex h-10 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
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

function DonationRow({ item }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (await copyText(item.value)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-rose-500/30 hover:bg-accent/30">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {item.type}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">{item.label}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <code className="font-mono text-sm text-foreground">{item.value}</code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Tersalin' : 'Salin'}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
