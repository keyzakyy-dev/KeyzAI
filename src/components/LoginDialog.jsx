import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { GoogleSignInButton } from './GoogleSignInButton'

// Popup login yang muncul saat user mencoba mengirim pesan tanpa session.
// Satu tujuan, satu tombol, langsung bisa — dibungkus gaya TUI halaman chat.
export function LoginDialog({ open, onOpenChange, onIdToken, loading = false, error = null }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="announcement-fade fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="tui-panel announcement-pop fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 bg-background px-5 pb-4 pt-5 font-mono shadow-xl focus:outline-none">
          <span className="tui-inset-title" aria-hidden="true">auth</span>
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
              masuk · keyzai
            </Dialog.Title>
            <Dialog.Description className="mt-1 font-mono text-xs leading-relaxed text-muted-foreground">
              Riwayat tersimpan dan lanjut di perangkat lain.
            </Dialog.Description>
          </div>

          <div className="mt-4 space-y-2">
            <div className="rounded-sm border border-foreground/10 p-2">
              <GoogleSignInButton
                onIdToken={onIdToken}
                disabled={loading}
                onError={() => {}}
                label={loading ? 'Memproses…' : 'Lanjutkan dengan Google'}
              />
            </div>
            {error && (
              <p
                className="w-full font-mono text-xs text-destructive"
                role="alert"
              >
                <span aria-hidden="true">! </span>{error}
              </p>
            )}
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              className="mx-auto mt-3 block font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              esc / lewati
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
