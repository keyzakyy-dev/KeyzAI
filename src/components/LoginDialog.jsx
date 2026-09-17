import * as Dialog from '@radix-ui/react-dialog'
import { Loader2, LogIn } from 'lucide-react'
import { GoogleSignInButton } from './GoogleSignInButton'

// Popup login yang muncul saat user mencoba mengirim pesan tanpa session.
export function LoginDialog({ open, onOpenChange, onIdToken, loading = false, error = null }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-lg focus:outline-none">
          <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted">
            <LogIn className="h-4 w-4 text-foreground" />
          </div>
          <Dialog.Title className="text-base font-semibold tracking-tight text-foreground">
            Masuk untuk mulai chat
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Masuk dengan Google supaya riwayat percakapanmu tersimpan dan bisa dilanjutkan dari perangkat lain.
          </Dialog.Description>

          <div className="mt-5 flex flex-col items-center gap-3">
            <GoogleSignInButton onIdToken={onIdToken} disabled={loading} onError={() => {}} />
            {loading && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memproses login…
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
