import * as Dialog from '@radix-ui/react-dialog'
import { X, ShieldCheck } from 'lucide-react'
import { GoogleSignInButton } from './GoogleSignInButton'

const COPY = {
  send: {
    title: 'Masuk untuk melanjutkan',
    desc: 'Kamu perlu masuk agar pesan bisa dikirim dan riwayat tersimpan. Pesanmu tidak hilang — otomatis terkirim setelah kamu masuk.',
  },
  expired: {
    title: 'Sesi berakhir, masuk kembali',
    desc: 'Sesi kamu berakhir. Masuk kembali untuk lanjut — pesan yang sudah diketik tetap aman.',
  },
  prd: {
    title: 'Masuk untuk memakai PRD Builder',
    desc: 'AI PRD Builder butuh akun agar progres tersimpan. Ide kamu tidak hilang — otomatis dilanjutkan setelah masuk.',
  },
  manual: {
    title: 'Masuk ke KeyzAI',
    desc: 'Masuk untuk menyimpan riwayat chat dan melanjutkannya di perangkat lain.',
  },
}

// Popup login: muncul saat aksi butuh session (kirim chat, sesi expired,
// PRD Builder, atau tombol "masuk" manual).
// Selalu di tengah layar via flex wrapper (bukan left/top + translate)
// supaya tidak geser oleh animasi transform.
export function LoginDialog({
  open,
  onOpenChange,
  onIdToken,
  loading = false,
  error = null,
  reason = 'send',
  pendingMessage = null,
}) {
  const copy = COPY[reason] || COPY.send
  const preview =
    typeof pendingMessage === 'string' && pendingMessage.trim()
      ? pendingMessage.trim().slice(0, 220)
      : null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="login-fade fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <Dialog.Content className="login-pop relative max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl focus:outline-none">
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>

            <div className="pr-8">
              <Dialog.Title className="text-base font-semibold text-foreground">
                {copy.title}
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {copy.desc}
              </Dialog.Description>
            </div>

            {preview && (
              <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Pesan yang tertunda
                </p>
                <p className="mt-1 line-clamp-3 text-sm text-foreground">
                  “{preview}”
                </p>
              </div>
            )}

            <div className="mt-5">
              <GoogleSignInButton
                onIdToken={onIdToken}
                disabled={loading}
                onError={() => {}}
                label={loading ? 'Menghubungkan…' : 'Lanjutkan dengan Google'}
              />
              {loading && (
                <p className="mt-2 text-center text-xs text-muted-foreground" role="status">
                  Menghubungkan ke Google, mohon tunggu…
                </p>
              )}
              {error && (
                <div
                  className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </div>
              )}
            </div>

            <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Kami hanya menyimpan nama, email, dan foto untuk riwayat chat.</span>
            </p>

            <Dialog.Close asChild>
              <button
                type="button"
                className="mx-auto mt-2 block text-xs text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
              >
                Nanti saja
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
