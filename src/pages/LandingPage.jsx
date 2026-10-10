import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePageMeta, SITE_NAME, SITE_DESC } from '../lib/seo'
import { useAuth } from '../hooks/useAuth'
import { Wordmark } from '../lib/logo-img'
import { MODELS } from '../lib/models'
import {
  ArrowRight,
  MessageSquare,
  Code,
  Pencil,
  Lock,
  GitBranch,
  Check,
  Zap,
  Menu,
  X,
} from 'lucide-react'
import { MeshCanvas } from '../components/MeshCanvas'
import { ChatMockup } from '../components/landing/ChatMockup'
import { FeaturesBento } from '../components/landing/FeaturesBento'
import { Footer } from '../components/landing/Footer'
import { Reveal } from '../lib/reveal'

/* ─── VU Meter ─────────────────────────────────────────────────────────── */

function VuMeter({ label, value, delay = 0, active = true }) {
  const [swept, setSwept] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setSwept(true), 400 + delay)
    return () => clearTimeout(t)
  }, [delay])

  // Needle angle: -45° (rest) → 35° (active). Map value to angle.
  const maxAngle = 80 // total sweep range
  const ratio = active ? Math.min(1, Math.max(0, parseFloat(value) / 10)) : 0
  const angle = swept ? -45 + ratio * maxAngle : -45

  return (
    <div className="flex flex-col items-center gap-2" ref={ref}>
      <div className="relative w-16 h-24 sm:w-20 sm:h-28">
        {/* Meter face */}
        <div className="absolute inset-0 rounded-sm bg-gradient-to-b from-neutral-900 to-background border border-foreground/15 overflow-hidden">
          {/* Scale arc marks */}
          <div className="absolute bottom-2 left-2 right-2 h-px bg-foreground/20" />
          {/* Red zone indicator */}
          <div className="absolute top-3 right-2 w-1.5 h-1.5 rounded-full bg-yellow-400/60" />
          {/* Needle pivot */}
          <div
            className="absolute bottom-2 left-1/2 w-0.5 origin-bottom transition-transform ease-out"
            style={{
              transform: `translateX(-50%) rotate(${angle}deg)`,
              transitionDuration: `${600 + delay * 0.5}ms`,
            }}
          >
            <div className="w-0.5 h-10 sm:h-12 bg-yellow-400/80 rounded-full" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-yellow-400" />
          </div>
        </div>
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="font-heading text-xs font-medium text-yellow-400 tabular-nums">
        {active ? `${value} dB` : '—'}
      </span>
    </div>
  )
}

/* ─── Navbar ─────────────────────────────────────────────────────────────── */

function Navbar({ navigate }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const progressRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      if (progressRef.current) {
        const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
        progressRef.current.style.transform = `scaleX(${ratio})`
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = (e) => { if (e.matches) setOpen(false) }
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  const ctaClass =
    'inline-flex h-9 items-center gap-1.5 border border-foreground/15 bg-transparent px-4 text-sm font-mono font-medium text-foreground transition-colors hover:border-yellow-400/50 hover:text-yellow-400'

  return (
    <header
      className={`absolute inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        open ? 'border-foreground/10 bg-background/95 backdrop-blur-md' : 'border-transparent'
      }`}
    >
      {/* Hairline progress */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] overflow-hidden" aria-hidden="true">
        <div
          ref={progressRef}
          className="h-full w-full origin-left scale-x-0 bg-yellow-400"
        />
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="shrink-0 transition-opacity hover:opacity-80"
        >
          <Wordmark />
        </button>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button type="button" onClick={() => navigate('/chat')} className={ctaClass}>
            {user ? 'Open chat' : 'Sign in'}
            <ArrowRight className="size-3" aria-hidden="true" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1 md:hidden">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            className="relative flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:bg-foreground/[0.06]"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {open && (
        <div
          id="landing-mobile-nav"
          className="animate-fade-up border-t border-foreground/10 md:hidden"
          style={{ animationDuration: '220ms' }}
        >
          <nav className="mx-auto max-w-7xl px-4 pb-3 pt-1">
            <button
              type="button"
              onClick={() => { setOpen(false); navigate('/chat') }}
              className="my-3 h-11 w-full bg-yellow-400 text-sm font-mono font-medium text-neutral-900 transition-colors hover:bg-yellow-300"
            >
              {user ? 'Open chat →' : 'Sign in with Google'}
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}

function MenuIcon({ open }) {
  return (
    <>
      <Menu className={`h-4 w-4 transition-all duration-300 ${open ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} aria-hidden="true" />
      <X className={`absolute h-4 w-4 transition-all duration-300 ${open ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} aria-hidden="true" />
    </>
  )
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */

function Hero({ navigate }) {
  const meshRef = useRef(null)

  useEffect(() => {
    const el = meshRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      raf = 0
      el.style.transform = `translate3d(0, ${window.scrollY * 0.2}px, 0)`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center lg:py-24">
      <div ref={meshRef} className="pointer-events-none absolute inset-0 will-change-transform">
        <MeshCanvas
          label="Decorative background: hero-only triangle mesh that bends around the cursor and ripples on click."
          className="pointer-events-none absolute inset-0"
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[10%] top-1/2 h-[28rem] w-[min(38rem,70vw)] -translate-y-1/2 rounded-full bg-yellow-400/10 blur-[140px]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Left: copy + CTA */}
          <div className="min-w-0 lg:col-span-6 xl:col-span-5">
            <a
              href="#features"
              className="animate-rise group mb-5 inline-flex max-w-full items-center gap-2 border border-foreground/15 bg-transparent py-1 pl-1.5 pr-3 text-xs font-mono text-foreground transition-colors hover:border-foreground/35 sm:mb-6 sm:gap-3 sm:py-1.5 sm:pl-2 sm:pr-3.5 sm:text-sm"
            >
              <span className="flex size-5 shrink-0 items-center justify-center border border-yellow-400/35 text-yellow-400 sm:size-6">
                <Check className="size-3 sm:size-3.5" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="truncate text-muted-foreground">
                <strong className="font-medium text-foreground">Free for everyone.</strong> No credit card
              </span>
              <ArrowRight className="size-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:size-3.5" aria-hidden="true" />
            </a>

            <h1
              className="animate-rise text-balance text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-[4.5rem]"
              style={{ animationDelay: '60ms' }}
            >
              All channels.<br />
              <span className="text-yellow-400">One mix.</span>
            </h1>

            <p
              className="animate-rise mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
              style={{ animationDelay: '140ms' }}
            >
              Every major AI model in a single workspace. Edit any message, branch your thinking, sync across devices. The interface that responds like the music.
            </p>

            <div
              className="animate-rise mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: '220ms' }}
            >
              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="group inline-flex h-11 items-center justify-center gap-2 bg-yellow-400 px-5 text-sm font-mono font-medium text-neutral-900 shadow-[0_8px_24px_rgba(250,204,21,0.2)] transition-all hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-[0_10px_28px_rgba(250,204,21,0.3)] sm:h-12 sm:px-6 sm:text-sm"
              >
                Open chat
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
              <a
                href="#prd-builder"
                className="inline-flex h-11 items-center justify-center border border-foreground/15 bg-transparent px-5 text-sm font-mono font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-yellow-400/50 hover:text-yellow-400 sm:h-12 sm:px-6 sm:text-sm"
              >
                From idea to PRD
              </a>
            </div>

            <ul
              className="animate-rise mt-10 flex flex-col gap-2.5 text-sm text-muted-foreground"
              style={{ animationDelay: '300ms' }}
            >
              {[
                'Sign in with Google, history saved across devices',
                'Responses stream as you type — no waiting',
                'Switch models anytime, mid-conversation',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-yellow-400" strokeWidth={2.5} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: VU Meter Bridge */}
          <div className="hidden lg:col-span-6 xl:col-span-7 lg:flex lg:items-center lg:justify-center">
            <div className="w-full max-w-xl">
              {/* Meter bridge container */}
              <div className="relative rounded-lg border border-foreground/15 bg-neutral-900/80 p-6 backdrop-blur-sm">
                {/* Channel labels strip */}
                <div className="mb-4 flex items-center justify-between border-b border-foreground/10 pb-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Input channels
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse" aria-hidden="true" />
                    <span className="font-mono text-[11px] text-yellow-400">LIVE</span>
                  </span>
                </div>

                {/* VU Meters row */}
                <div className="flex justify-between gap-2">
                  <VuMeter label="Chat" value="8.2" delay={0} />
                  <VuMeter label="Code" value="6.4" delay={80} />
                  <VuMeter label="Write" value="7.1" delay={160} />
                  <VuMeter label="Think" value="9.0" delay={240} />
                  <VuMeter label="Sync" value="0" active={false} delay={320} />
                </div>

                {/* Scale markings */}
                <div className="mt-4 flex justify-between font-mono text-[11px] text-muted-foreground/60">
                  <span>-∞</span>
                  <span>-20</span>
                  <span>-10</span>
                  <span className="text-yellow-400/60">0</span>
                  <span className="text-yellow-400/60">+3</span>
                  <span className="text-red-400/40">+6</span>
                </div>
              </div>

              {/* Model ticker below meters */}
              <div className="mt-4 flex items-center gap-3 rounded border border-foreground/10 bg-neutral-900/60 px-4 py-2.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground shrink-0">
                  Sources:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {MODELS.slice(0, 4).map((m) => (
                    <span key={m.id} className="font-mono text-[11px] text-foreground/70">
                      {m.label}
                    </span>
                  ))}
                  <span className="font-mono text-[11px] text-yellow-400">+more</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Features (Channel Cards) ──────────────────────────────────────────── */

function FeaturesSection() {
  const FEATURES = [
    {
      id: 'chat',
      title: 'Streamless Chat',
      desc: 'First token under 2 seconds. Responses flow as you type — no spinning, no waiting. The interface stays out of your way.',
      icon: MessageSquare,
      badge: 'Real-time',
      span: 'col-span-2 md:col-span-2 lg:col-span-2',
      value: '8.2',
    },
    {
      id: 'code',
      title: 'Code Analysis',
      desc: 'Identify bugs, refactor syntax, and dissect architecture with deep reasoning across every major language.',
      icon: Code,
      badge: 'Multi-lang',
      span: 'col-span-1 md:col-span-1 lg:col-span-1',
      value: '6.4',
    },
    {
      id: 'tree',
      title: 'Tree Branching',
      desc: 'Edit any message or regenerate forward. Explore multiple reasoning paths without losing the original thread.',
      icon: GitBranch,
      badge: 'Zero-loss',
      span: 'col-span-1 md:col-span-1 lg:col-span-1',
      value: '9.0',
    },
    {
      id: 'writing',
      title: 'Draft & Create',
      desc: 'Write professional emails, essays, or technical docs with instant style adjustment and tone control.',
      icon: Pencil,
      badge: 'Flexible',
      span: 'col-span-1 md:col-span-1 lg:col-span-1',
      value: '7.1',
    },
    {
      id: 'privacy',
      title: 'Private & Tracked',
      desc: 'Your data is never sold or used to train public models. Privacy is a feature, not a setting.',
      icon: Lock,
      badge: 'Secure',
      span: 'col-span-1 md:col-span-1 lg:col-span-1',
      value: '5.0',
    },
  ]

  return (
    <section id="features" className="relative scroll-mt-20 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-foreground/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <span className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Channel mapping
            </span>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              What each channel <span className="text-yellow-400">handles</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
            One workspace for thinking, making, and shipping faster.
          </p>
        </div>

        <Reveal from="up" className="feature-grid-reveal">
          <div className="feature-grid relative grid grid-cols-2 md:grid-cols-3">
            {FEATURES.map((item, index) => {
              const Icon = item.icon
              return (
                <Reveal key={item.id} from="up" delay={index * 60} className={item.span} style={{ '--card-line-delay': `${index * 100}ms` }}>
                  <div className="feature-card group relative flex h-full flex-col justify-between overflow-hidden p-4 sm:p-6 md:p-8">
                    <div>
                      <div className="mb-4 flex flex-col items-start gap-2.5 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex size-9 items-center justify-center text-foreground sm:size-10">
                          <Icon className="size-5 sm:size-6" />
                        </div>
                        <span className="bg-background px-2.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground sm:px-3 sm:py-1">
                          {item.badge}
                        </span>
                      </div>
                      <h3 className="text-base font-medium text-foreground sm:text-lg">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─── PRD Builder ────────────────────────────────────────────────────────── */

function PrdBuilder({ navigate }) {
  const steps = [
    { icon: MessageSquare, label: 'Ideation', desc: 'Describe your product concept in plain language' },
    { icon: Zap, label: 'Clarify', desc: 'AI asks the right questions to fill gaps' },
    { icon: Code, label: 'Tech Stack', desc: 'Recommended technologies for your use case' },
    { icon: GitBranch, label: 'Structure', desc: 'Feature hierarchy and architecture map' },
    { icon: Pencil, label: 'PRD', desc: 'Complete document, ready to build' },
  ]

  return (
    <section id="prd-builder" className="relative scroll-mt-20 py-12 sm:py-14 lg:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-16 size-64 rounded-full bg-yellow-400/10 blur-[100px] hidden lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-8 size-72 rounded-full bg-yellow-400/10 blur-[100px] hidden lg:block" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-foreground/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-yellow-400" aria-hidden="true" />
              Beta
            </span>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              From idea to PRD in <span className="text-yellow-400">minutes</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
            Turn rough concepts into clear, structured product documents ready to build.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Hero card */}
          <div className="lg:col-span-3">
            <Reveal from="up">
              <div className="feature-card group relative flex h-full flex-col justify-between overflow-hidden p-6 sm:p-8 lg:p-10 border border-foreground/15">
                <div className="relative space-y-4">
                  <h3 className="text-xl font-medium text-foreground sm:text-2xl">
                    AI that understands your vision
                  </h3>
                  <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                    Describe your idea and the AI will ask the important things, recommend technologies, structure the product, and produce a complete PRD. Every section is editable.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/prd-builder')}
                    className="mt-4 inline-flex h-10 items-center gap-2 bg-yellow-400 px-5 text-sm font-mono font-medium text-neutral-900 transition-colors hover:bg-yellow-300 sm:mt-6 sm:h-11"
                  >
                    Try now
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Steps as channel strip */}
          <div className="lg:col-span-2">
            <Reveal from="up" delay={100}>
              <div className="flex flex-col gap-3">
                {steps.map((step, i) => (
                  <div key={step.label} className="flex items-start gap-3 rounded border border-foreground/10 bg-neutral-900/50 p-3 transition-colors hover:border-yellow-400/30">
                    <span className="font-mono text-xs font-medium text-yellow-400 shrink-0 mt-0.5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <step.icon className="size-3.5 text-foreground/60" aria-hidden="true" />
                        <span className="text-sm font-medium text-foreground">{step.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Models (Channel Selector) ─────────────────────────────────────────── */

function ModelsSection() {
  const [copied, setCopied] = useState(null)
  const copyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 1200)
    })
  }

  return (
    <section id="models" className="relative scroll-mt-20 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal from="up">
          <div className="mb-10 flex flex-col justify-between gap-4 border-b border-foreground/10 pb-6 sm:flex-row sm:items-end">
            <div>
              <span className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Channel selector
              </span>
              <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Every model. <span className="text-yellow-400">Zero cost.</span>
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
              Pick the model that fits each conversation. Switch mid-chat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
            {MODELS.map((m, index) => (
              <div key={m.id} className="feature-card relative p-6 sm:p-8 border border-foreground/10" style={{ '--card-line-delay': `${index * 100}ms` }}>
                <ModelCard model={m} copied={copied} onCopy={copyId} />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function ModelCard({ model, copied, onCopy }) {
  return (
    <div className="group relative overflow-hidden bg-neutral-900/30 transition-colors duration-200">
      {/* Watermark */}
      <img
        src={model.logo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 h-[64%] w-[64%] -translate-y-1/2 object-contain opacity-[0.06]"
      />
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-background ring-1 ring-border rounded">
            <img src={model.logo} alt="" className="h-full w-full object-contain" />
          </span>
          <span className="font-mono text-xs font-medium text-muted-foreground">{model.provider}</span>
        </div>

        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium text-foreground">{model.label}</h3>
          {model.tagline === 'Baru & eksperimental' && (
            <span className="bg-yellow-400/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-yellow-400">
              New
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="bg-background/80 px-2 py-1 font-mono text-[11px] text-muted-foreground ring-1 ring-border/60 rounded">
            {model.id}
          </span>
          <button
            type="button"
            onClick={() => onCopy(model.id)}
            title="Copy model ID"
            className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground rounded"
          >
            {copied === model.id ? (
              <Check className="h-3.5 w-3.5 text-yellow-400" />
            ) : (
              <CopyIcon />
            )}
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="font-mono text-[11px] font-medium text-yellow-400/90">
            Free
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {model.tagline}
          </span>
        </div>
      </div>
    </div>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5" aria-hidden="true">
      <rect x="5" y="5" width="9" height="9" rx="1" />
      <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" />
    </svg>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export function LandingPage() {
  const navigate = useNavigate()
  usePageMeta({ title: SITE_NAME, description: SITE_DESC, path: '/' })

  useEffect(() => {
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is KeyzAI free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, KeyzAI is free with no credit card required. Sign in with Google and start chatting with any AI model instantly.',
          },
        },
        {
          '@type': 'Question',
          name: 'What AI models are available on KeyzAI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'KeyzAI provides access to multiple AI models including Qwen, DeepSeek, and Atria. You can switch between models anytime during a conversation.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are chat histories saved?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Chat history syncs automatically across all devices you use. Data is stored in Cloudflare D1 and protected by your Google login session.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the PRD Builder?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The PRD Builder turns rough product ideas into complete Product Requirements Documents. You enter through chat, the AI clarifies details, recommends technology, and structures the product.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does streaming work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'KeyzAI uses SSE (Server-Sent Events) to stream AI responses as they are generated. You do not need to wait for completion and can stop anytime with the stop button.',
          },
        },
      ],
    }
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.textContent = JSON.stringify(faq, null, 2)
    document.head.appendChild(el)
    return () => el.remove()
  }, [])

  return (
    <div className="relative min-h-dvh bg-background text-foreground antialiased">
      <div className="relative">
        <Navbar navigate={navigate} />
        <main>
          <Hero navigate={navigate} />
          <FeaturesSection />
          <PrdBuilder navigate={navigate} />
          <ModelsSection />
        </main>
        <Footer />
      </div>
    </div>
  )
}
