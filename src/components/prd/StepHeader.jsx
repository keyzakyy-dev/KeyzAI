import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Button } from '../ui/button'

/**
 * Header seragam untuk tiap langkah PRD Builder: label kecil, judul, dan
 * deskripsi singkat. Dipakai Clarify, TechPref, Structure, & PrdEditor supaya
 * ritme visualnya konsisten (tidak ada langkah yang terlihat "berbeda").
 */
export function StepHeader({ label, title, description }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/80">{label}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
      {description && <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{description}</p>}
    </div>
  )
}

/**
 * Bar navigasi bawah yang seragam di tiap langkah: Kembali di kiri, aksi
 * utama (Lanjut) di kanan. `nextLabel`/`nextIcon` bisa diganti per langkah.
 */
export function StageNav({ onBack, backLabel = 'Kembali', onNext, nextLabel = 'Lanjut', nextDisabled = false, loading = false, children }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 self-start sm:self-auto">
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Button>
      )}
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {children}
        {onNext && (
          <Button size="sm" onClick={onNext} disabled={nextDisabled || loading} className="gap-1.5">
            {nextLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
