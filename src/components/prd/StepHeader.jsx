/**
 * Header seragam untuk tiap langkah PRD Builder: label kecil, judul, dan
 * deskripsi singkat. Dipakai Clarify, TechPref, Structure, & PrdEditor supaya
 * ritme visualnya konsisten (tidak ada langkah yang terlihat "berbeda").
 */
export function StepHeader({ label, title, description }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
      {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  )
}
