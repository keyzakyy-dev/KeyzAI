import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { GoogleSignInButton } from './GoogleSignInButton'
import logo from '../assets/logo.png'

// Popup login yang muncul saat user mencoba mengirim pesan tanpa session.
// Disengaja tanpa "benefit list": satu tujuan, satu tombol, langsung bisa.
export function LoginDialog({ open, onOpenChange, onIdToken, loading = false, error = null }) {
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
            <img src={logo} alt="KeyzAI" className="h-7 w-auto" />
            <Dialog.Title className="pt-1 text-xl font-bold tracking-tight text-foreground">
              Simpan chat-mu
            </Dialog.Title>
            <Dialog.Description className="text-sm leading-relaxed text-muted-foreground">
              Masuk dengan Google. Riwayat tersimpan dan bisa dilanjutkan dari perangkat lain.
            </Dialog.Description>
          </div>

          <div className="mt-6 space-y-3">
            <GoogleSignInButton
              onIdToken={onIdToken}
              disabled={loading}
              onError={() => {}}
              label={loading ? 'Memproses…' : 'Lanjutkan dengan Google'}
            />
            {error && (
              <p
                className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-xs text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              className="mx-auto mt-5 block rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Lewati
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
