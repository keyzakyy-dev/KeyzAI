import { KeyMark } from '../../lib/key-mark'

/**
 * Loading state kontekstual untuk tahap AI. Pesan berganti tiap beberapa
 * detik (disuplai hook), memakai class shimmer `thinking-fade` yang sudah
 * ada di index.css — bukan spinner tanpa konteks.
 */
export function StageLoading({ message = 'Memproses…' }) {
  return (
    <div className="flex items-center gap-2.5" role="status" aria-live="polite">
      <span className="shrink-0 text-primary">
        <KeyMark className="h-4 w-4" />
      </span>
      <span key={message} className="font-serif text-foreground thinking-fade">
        {message}
      </span>
    </div>
  )
}

/**
 * Error state generik untuk tahap AI. Pesan eksplisit + tombol coba lagi.
 */
export function StageError({ message = 'Terjadi kesalahan.', onRetry, retryLabel = 'Coba lagi' }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-center gap-2.5">
        <span className="shrink-0 text-destructive">
          <KeyMark className="h-4 w-4" />
        </span>
        <p className="text-sm text-foreground">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}
