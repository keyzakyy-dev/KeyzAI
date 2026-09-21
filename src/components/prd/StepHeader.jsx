import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Button } from '../ui/button'

/**
 * Header seragam untuk tiap langkah PRD Builder: nomor langkah serif (motif
 * dokumen), label, judul, dan deskripsi singkat. Dipakai Clarify, TechPref,
 * Structure, & PrdEditor supaya ritme visualnya konsisten.
 */
export function StepHeader({ step, label, title, description }) {
  return (
    <div className="space-y-2.5">
      <p className="flex items-baseline gap-2">
        {step && <span className="font-serif text-sm tabular-nums text-foreground">{step}</span>}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
      {description && <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{description}</p>}
    </div>
  )
}

/**
 * Bar navigasi bawah yang seragam di tiap langkah: Kembali di kiri, aksi
 * utama (Lanjut) di kanan. `nextLabel`/`nextIcon` bisa diganti per langkah.
 * Tombol 44px di mobile, 32px di desktop.
 */
export function StageNav({ onBack, backLabel = 'Kembali', onNext, nextLabel = 'Lanjut', nextDisabled = false, loading = false, children }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="h-11 gap-1.5 self-start sm:h-8 sm:self-auto">
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Button>
      )}
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {children}
        {onNext && (
          <Button size="sm" onClick={onNext} disabled={nextDisabled || loading} className="h-11 gap-1.5 sm:h-8">
            {nextLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
