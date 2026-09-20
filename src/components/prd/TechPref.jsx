import { Check, Sparkles, Wand2 } from 'lucide-react'

import { Button } from '../ui/button'
import { StageLoading } from './StageLoading'
import { StepHeader, StageNav } from './StepHeader'
import { TECH_KEYS } from '../../state/prd-model'

const TECH_OPTIONS = {
  frontend: ['React', 'Next.js', 'Vue', 'SvelteKit', 'Flutter', 'React Native'],
  backend: ['Node.js (Express)', 'NestJS', 'Go', 'Python (FastAPI)', 'Ruby on Rails', 'PHP (Laravel)'],
  database: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Firebase Firestore', 'Supabase'],
  deployment: ['Vercel', 'Netlify', 'Cloudflare', 'AWS', 'Google Cloud', 'Docker + VPS'],
}
const AUTH_OPTIONS = ['Email & Password', 'Google OAuth', 'JWT', 'Magic Link', 'SSO / SAML', 'Phone OTP']

const MODES = [
  {
    id: 'auto',
    icon: Sparkles,
    title: 'Biarkan AI memilih',
    desc: 'Rekomendasi frontend, backend, database, auth, dan deployment sesuai kebutuhan produk.',
  },
  {
    id: 'manual',
    icon: Wand2,
    title: 'Saya pilih sendiri',
    desc: 'Tentukan sendiri stack-nya; AI akan memakainya apa adanya di PRD.',
  },
]

/**
 * STEP 3 — Preferensi teknologi. "Biarkan AI memilih" (default) memanggil
 * stage 'tech' yang merekomendasikan stack + alasan; "Pilih sendiri"
 * menampilkan 5 dropdown (frontend, backend, database, auth, deployment).
 */
export function TechPref({
  mode = 'auto',
  stack = {},
  onSelectMode,
  onManualChange,
  loading,
  loadingMessage,
  onContinue,
  onBack,
}) {
  const hasAutoStack = mode === 'auto' && Object.values(stack).some((v) => v)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <StepHeader
        label="Teknologi"
        title="Bagaimana dengan teknologinya?"
        description="Pilih cara AI membantu menentukan stack untuk produk kamu."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((m) => {
          const Icon = m.icon
          const active = mode === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMode(m.id)}
              className={`relative flex flex-col items-start gap-2.5 rounded-2xl border p-5 text-left transition-all ${
                active
                  ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-foreground/30 hover:shadow-sm'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                  active ? 'border-primary/40 bg-primary/10' : 'border-border bg-background'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              </span>
              <span className="text-sm font-semibold text-foreground">{m.title}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{m.desc}</span>
              {active && (
                <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <StageLoading message={loadingMessage} />
        </div>
      )}

      {!loading && mode === 'auto' && hasAutoStack && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-muted/40 px-4 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rekomendasi AI</p>
          </div>
          <ul className="divide-y divide-border">
            {TECH_KEYS.filter((k) => stack[k]).map((k) => {
              const v = stack[k]
              const name = typeof v === 'string' ? v : v?.name
              const reason = typeof v === 'string' ? '' : v?.reason
              return (
                <li key={k} className="px-4 py-3">
                  <span className="flex items-baseline gap-2 text-sm">
                    <span className="w-24 flex-shrink-0 text-xs font-medium capitalize text-muted-foreground">{k}</span>
                    <span className="font-medium text-foreground">{name}</span>
                  </span>
                  {reason && <p className="mt-1 pl-[6.5rem] text-[11px] leading-relaxed text-muted-foreground/80">{reason}</p>}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {!loading && mode === 'manual' && (
        <div className="space-y-3.5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          {TECH_KEYS.map((k) => {
            const opts = k === 'authentication' ? AUTH_OPTIONS : TECH_OPTIONS[k] || []
            const v = typeof stack[k] === 'string' ? stack[k] : stack[k]?.name || ''
            return (
              <div key={k}>
                <label htmlFor={`tech-${k}`} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {k === 'authentication' ? 'Authentication' : k}
                </label>
                <select
                  id={`tech-${k}`}
                  value={v}
                  onChange={(e) => onManualChange(k, e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Belum dipilih</option>
                  {opts.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}

      <StageNav onBack={onBack} onNext={onContinue} nextDisabled={loading} nextLabel={loading ? 'Memproses…' : 'Lanjut ke struktur'} />
    </div>
  )
}
