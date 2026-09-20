import { ArrowLeft, Check, Sparkles, Wand2 } from 'lucide-react'

import { Button } from '../ui/button'
import { StageLoading } from './StageLoading'
import { StepHeader } from './StepHeader'
import { TECH_KEYS } from '../../state/prd-model'

const TECH_OPTIONS = {
  frontend: ['React', 'Next.js', 'Vue', 'SvelteKit', 'Flutter', 'React Native'],
  backend: ['Node.js (Express)', 'NestJS', 'Go', 'Python (FastAPI)', 'Ruby on Rails', 'PHP (Laravel)'],
  database: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Firebase Firestore', 'Supabase'],
  deployment: ['Vercel', 'Netlify', 'Cloudflare', 'AWS', 'Google Cloud', 'Docker + VPS'],
}
const AUTH_OPTIONS = ['Email & Password', 'Google OAuth', 'JWT', 'Magic Link', 'SSO / SAML', 'Phone OTP']

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
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <StepHeader label="Teknologi" title="Bagaimana dengan teknologinya?" />

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelectMode('auto')}
          className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
            mode === 'auto' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-foreground/30'
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <span className="text-sm font-semibold text-foreground">Biarkan AI memilih</span>
          <span className="text-xs leading-relaxed text-muted-foreground">
            Rekomendasi frontend, backend, database, auth, dan deployment sesuai kebutuhan produk.
          </span>
          {mode === 'auto' && (
            <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-primary">
              <Check className="h-3 w-3" /> Dipilih
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('manual')}
          className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
            mode === 'manual' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-foreground/30'
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background">
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="text-sm font-semibold text-foreground">Saya pilih sendiri</span>
          <span className="text-xs leading-relaxed text-muted-foreground">
            Tentukan sendiri stack-nya; AI akan memakainya apa adanya di PRD.
          </span>
          {mode === 'manual' && (
            <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-primary">
              <Check className="h-3 w-3" /> Dipilih
            </span>
          )}
        </button>
      </div>

      {loading && (
        <div className="rounded-xl border border-border bg-card p-5">
          <StageLoading message={loadingMessage} />
        </div>
      )}

      {!loading && mode === 'auto' && hasAutoStack && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rekomendasi AI</p>
          <ul className="space-y-2.5">
            {TECH_KEYS.filter((k) => stack[k]).map((k) => {
              const v = stack[k]
              const name = typeof v === 'string' ? v : v?.name
              const reason = typeof v === 'string' ? '' : v?.reason
              return (
                <li key={k} className="flex flex-col gap-0.5">
                  <span className="text-sm">
                    <span className="font-medium capitalize text-foreground">{k}:</span>{' '}
                    <span className="text-foreground">{name}</span>
                  </span>
                  {reason && <span className="pl-1 text-[11px] leading-relaxed text-muted-foreground/80">{reason}</span>}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {!loading && mode === 'manual' && (
        <div className="space-y-3.5 rounded-xl border border-border bg-card p-4 sm:p-5">
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

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali
        </Button>
        <Button onClick={onContinue} size="sm" disabled={loading}>
          {loading ? 'Memproses…' : 'Lanjut ke struktur →'}
        </Button>
      </div>
    </div>
  )
}
