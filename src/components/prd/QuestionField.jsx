import { Check } from 'lucide-react'

import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

/**
 * Render satu pertanyaan klarifikasi sesuai tipenya. Tipe ditentukan AI
 * (lihat worker/src/prd.js stage 'questions'); opsi hanya muncul untuk
 * single/multiple/dropdown.
 *
 * `value` adalah string | string[] | null. null = belum dijawab/dilewati.
 */
export function QuestionField({ type = 'text', options = [], placeholder = '', value, onChange, disabled = false }) {
  if (type === 'text' || type === 'number') {
    return (
      <Input
        type={type === 'number' ? 'number' : 'text'}
        value={value == null ? '' : Array.isArray(value) ? value.join(', ') : value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-11 text-base sm:text-sm"
      />
    )
  }

  if (type === 'textarea') {
    return (
      <Textarea
        value={value == null ? '' : Array.isArray(value) ? value.join(', ') : value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="min-h-[96px] resize-y text-base sm:text-sm"
      />
    )
  }

  if (type === 'boolean') {
    const picked = value != null && value !== ''
    return (
      <div className="flex gap-2">
        {['Ya', 'Tidak'].map((label) => {
          const active = String(value || '') === label
          return (
            <button
              key={label}
              type="button"
              disabled={disabled}
              onClick={() => onChange(label)}
              className={`flex h-11 flex-1 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                active
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-accent/40 hover:text-foreground'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    )
  }

  // single / multiple / dropdown → daftar opsi (pola list PreferencesDialog)
  const isMulti = type === 'multiple'
  const list = Array.isArray(value) ? value : value ? [String(value)] : []

  if (type === 'dropdown') {
    return (
      <select
        value={Array.isArray(value) ? value[0] || '' : value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 sm:text-sm"
      >
        <option value="">Pilih salah satu…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  }

  const toggle = (label) => {
    if (isMulti) {
      onChange(list.includes(label) ? list.filter((l) => l !== label) : [...list, label])
    } else {
      onChange(label)
    }
  }

  return (
    <div role={isMulti ? 'group' : 'radiogroup'} className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {options.map((o) => {
        const selected = list.includes(o)
        return (
          <button
            key={o}
            type="button"
            role={isMulti ? undefined : 'radio'}
            aria-checked={isMulti ? undefined : selected}
            aria-pressed={isMulti ? selected : undefined}
            disabled={disabled}
            onClick={() => toggle(o)}
            className={`flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm transition-colors ${
              selected ? 'bg-accent/40 text-foreground' : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
            }`}
          >
            <span
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center border text-[11px] ${
                isMulti ? 'rounded-md' : 'rounded-full'
              } ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}
            >
              {selected && <Check className="h-3 w-3" />}
            </span>
            <span className="min-w-0 flex-1 break-words">{o}</span>
          </button>
        )
      })}
    </div>
  )
}
