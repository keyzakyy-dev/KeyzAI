import * as Dialog from '@radix-ui/react-dialog'
import { ReloadIcon, EnterIcon, CounterClockwiseClockIcon, DesktopIcon, BadgeIcon, Cross2Icon } from '@radix-ui/react-icons'

import { GoogleSignInButton } from './GoogleSignInButton'

const BENEFITS = [
  {
    icon: CounterClockwiseClockIcon,
    title: 'Riwayat tersimpan',
    desc: 'Percakapan disimpan aman di akunmu.',
  },
  {
    icon: DesktopIcon,
    title: 'Lanjut di mana saja',
    desc: 'Akses dari perangkat mana pun, kapan pun.',
  },
  {
    icon: BadgeIcon,
    title: 'Gratis selamanya',
    desc: 'Tanpa biaya, tanpa kartu kredit.',
  },
]

// Popup login yang muncul saat user mencoba mengirim pesan tanpa session.
export function LoginDialog({ open, onOpenChange, onIdToken, loading = false, error = null }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="announcement-fade fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="announcement-pop fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl focus:outline-none">
          {/* Header */}
          <div className="relative border-b border-border bg-card p-6 sm:p-7">
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Cross2Icon className="h-4 w-4" />
              </button>
            </Dialog.Close>

            <div className="relative space-y-2 pr-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-foreground">
                <EnterIcon className="h-6 w-6" />
              </span>
              <Dialog.Title className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Masuk untuk mulai chat
              </Dialog.Title>
              <Dialog.Description className="text-sm leading-relaxed text-muted-foreground">
                Pesanmu menunggu. Masuk dulu supaya percakapanmu tidak hilang.
              </Dialog.Description>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-7">
            <ul className="space-y-3.5">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                    <Icon className="h-4 w-4 text-foreground" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Masuk cepat
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="flex flex-col items-center gap-3">
              <GoogleSignInButton onIdToken={onIdToken} disabled={loading} onError={() => {}} />
              {loading && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ReloadIcon className="h-3.5 w-3.5 animate-spin" />
                  Memproses login…
                </p>
              )}
              {error && (
                <p
                  className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-xs text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-border bg-card p-4 sm:px-6">
            <p className="text-xs text-muted-foreground">Tanpa login, chat tidak tersimpan.</p>
            <Dialog.Close asChild>
              <button
                type="button"
                className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Nanti saja
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}