import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

/**
 * Modal instruksi regenerate section. AI hanya menulis ulang section yang
 * dipilih; konteks project lengkap dikirim lewat hook (lihat prd-api.js).
 *
 * `onConfirm(instruction)` menerima teks instruksi; penanganan error &
 * loading state dipegang parent (PrdEditor) supaya dialog tetap polos.
 */
export function RegenerateDialog({ open, onOpenChange, sectionTitle, onConfirm, loading = false, error = null }) {
  const [instruction, setInstruction] = useState('')

  // Reset isi saat dialog ditutup, supaya instruksi lama tidak nyangkut.
  useEffect(() => {
    if (!open) setInstruction('')
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="announcement-fade fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="announcement-pop fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl focus:outline-none">
          <div className="relative flex-shrink-0 p-6 pb-0">
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
            <Dialog.Title className="pr-8 text-lg font-bold tracking-tight text-foreground">
              Regenerate section
            </Dialog.Title>
            <Dialog.Description className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Bagian mana yang ingin kamu ubah? AI hanya menulis ulang{' '}
              <span className="font-medium text-foreground">“{sectionTitle}”</span>.
            </Dialog.Description>
          </div>

          <form
            className="flex flex-1 flex-col overflow-hidden p-6 pt-4"
            onSubmit={(e) => {
              e.preventDefault()
              const t = instruction.trim()
              if (t) onConfirm(t)
            }}
          >
            <Textarea
              autoFocus
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Contoh: Buat bagian ini lebih teknis. Atau: Tambahkan requirement untuk admin."
              maxLength={600}
              className="min-h-[110px] resize-y"
              required
            />
            {error && (
              <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="mt-5 flex flex-shrink-0 justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" size="sm">
                  Batal
                </Button>
              </Dialog.Close>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? 'Menulis ulang…' : 'Regenerate dengan AI'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
