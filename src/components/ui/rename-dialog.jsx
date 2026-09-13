import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from './button'
import { Input } from './input'

export function RenameDialog({ open, onOpenChange, value, onSave }) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  const submit = () => {
    const t = draft.trim()
    if (!t) return
    onSave(t)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="text-base font-semibold tracking-tight text-foreground">
            Ganti nama percakapan
          </Dialog.Title>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
                submit()
              }
            }}
            className="mt-4"
            autoFocus
            maxLength={120}
          />
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">
                Batal
              </Button>
            </Dialog.Close>
            <Button size="sm" onClick={submit} disabled={!draft.trim()}>
              Simpan
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}