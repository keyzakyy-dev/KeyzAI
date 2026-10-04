import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePageMeta, SITE_NAME, SITE_DESC } from '../lib/seo'
import { Reveal } from '../lib/reveal'
import { useAuth } from '../hooks/useAuth'
import { LogoImg } from '../lib/logo-img'
import { ModelMarquee } from '../components/ModelMarquee'
import { MODELS } from '../lib/models'
import {
  ArrowRight,
  ArrowUp,
  MessageSquare,
  Code,
  CircleHelp,
  Menu,
  X,
  FileText,
  Copy,
  Check,
} from 'lucide-react'
import { MeshCanvas } from '../components/MeshCanvas'
import { ArchitectureGraph } from '../components/landing/ArchitectureGraph'
import { FeaturesBento } from '../components/landing/FeaturesBento'

function GithubMark({ className, ...props }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}




function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoImg className="h-8 w-auto" />
    </div>
  )
}

function Navbar({ navigate }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const progressRef = useRef(null)

  // Listener untuk progress baca dan scroll-spy.
  useEffect(() => {
    const onScroll = () => {
      // progress baca: ditulis langsung ke DOM agar tidak memicu re-render tiap frame
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

  // Tutup panel mobile dengan Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Panel mobile tidak relevan lagi saat layar melebar ke desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = (e) => {
      if (e.matches) setOpen(false)
    }
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  const ctaClass =
    'inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/15 bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/[0.04]'

  return (
    <header
      className={`absolute inset-x-0 top-0 z-50 border-b border-transparent bg-transparent transition-colors duration-300 ${
        open ? 'border-foreground/10' : ''
      }`}
    >
      {/* Hairline progress baca */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] overflow-hidden" aria-hidden="true">
        <div
          ref={progressRef}
          className="h-full w-full origin-left scale-x-0 bg-primary"
        />
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Kembali ke atas"
          className="shrink-0 rounded-full transition-opacity hover:opacity-80"
        >
          <Logo />
        </button>

        {/* Desktop */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button type="button" onClick={() => navigate('/chat')} className={ctaClass}>
            {user ? 'Buka chat' : 'Masuk'}
          </button>
        </div>

        {/* Mobile */}
        <div className="flex shrink-0 items-center gap-1 md:hidden">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/[0.06]"
          >
            <Menu
              className={`h-4 w-4 transition-all duration-300 ${
                open ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
              }`}
            />
            <X
              className={`absolute h-4 w-4 transition-all duration-300 ${
                open ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Panel menu mobile */}
      {open && (
        <div
          id="landing-mobile-nav"
          className="animate-fade-up border-t border-foreground/10 bg-transparent md:hidden"
          style={{ animationDuration: '220ms' }}
        >
          <nav className="mx-auto max-w-7xl px-4 py-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate('/chat')
              }}
              className="my-3 h-11 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {user ? 'Buka chat' : 'Masuk dengan Google'}
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}

function Hero({ navigate }) {
  return (
    /* Tinggi = viewport dikurangi header fixed (h-16) supaya isi hero tepat
       satu layar tanpa memaksa scroll. Kolom kanan sengaja kosong — mesh
       heksagon di belakang mengisi ruang itu, mockup sudah dihapus. */
    <section className="relative overflow-hidden py-16 sm:py-20 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center lg:py-24">
      <MeshCanvas
        label="Decorative background: hero-only triangle mesh that bends around the cursor and ripples on click."
        className="pointer-events-none absolute inset-0"
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-6 xl:col-span-5">
            <a
              href="#models"
              className="animate-rise group mb-6 inline-flex max-w-full items-center gap-3 rounded-full border border-foreground/15 bg-transparent py-1.5 pl-2 pr-3.5 text-sm text-foreground transition-colors hover:border-foreground/35"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/35 text-emerald-500 dark:text-emerald-400">
                <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="truncate text-muted-foreground">
                <strong className="font-medium text-foreground">Gratis untuk semua.</strong>{' '}
                Tanpa kartu kredit
              </span>
              <ArrowRight
                className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>

            <h1
              className="animate-rise text-balance text-[2.75rem] font-medium leading-[1.02] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-[4.5rem]"
              style={{ animationDelay: '60ms' }}
            >
              Akses semua AI favorit, gratis.
            </h1>

            <p
              className="animate-rise mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
              style={{ animationDelay: '140ms' }}
            >
              Satu tempat untuk semua kebutuhan AI. Chat, edit, dan eksplorasi tanpa batas.
            </p>

            <div
              className="animate-rise mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: '220ms' }}
            >
              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-medium text-primary-foreground shadow-[0_8px_24px_hsl(var(--foreground)/0.12)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_10px_28px_hsl(var(--foreground)/0.18)]"
              >
                Buka chat
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
              <a
                href="#prd-builder"
                className="inline-flex h-12 items-center justify-center rounded-full border border-foreground/15 bg-transparent px-6 text-[15px] font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-foreground/40 hover:bg-foreground/[0.04]"
              >
                Dari ide jadi PRD
              </a>
            </div>

            <ul
              className="animate-rise mt-10 flex flex-col gap-2.5 text-sm text-muted-foreground"
              style={{ animationDelay: '300ms' }}
            >
              {[
                'Masuk dengan Google, riwayat otomatis tersimpan',
                'Jawaban mengalir saat diketik, tidak perlu ditunggu',
                'Bisa ganti model kapan saja',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-emerald-500 dark:text-emerald-400" strokeWidth={2.5} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom kanan: Architecture Graph */}
          <div className="hidden lg:col-span-6 lg:flex lg:items-center lg:justify-center xl:col-span-7">
            <ArchitectureGraph />
          </div>

        </div>
      </div>
    </section>
  )
}

function ModelMarqueeSection() {
  return (
    <section className="border-y border-foreground/10 py-3 sm:py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Model tersedia
        </div>
        <ModelMarquee />
      </div>
    </section>
  )
}


function PrdBuilder({ navigate }) {
  const steps = [
    { icon: MessageSquare, label: 'Ide', desc: 'Ceritakan konsep produkmu' },
    { icon: CircleHelp, label: 'Klarifikasi', desc: 'AI menggali detail penting' },
    { icon: Code, label: 'Teknologi', desc: 'Rekomendasi stack yang tepat' },
    { icon: FileText, label: 'Struktur', desc: 'Susunan fitur & arsitektur' },
    { icon: FileText, label: 'PRD', desc: 'Dokumen siap pakai' },
  ]

  return (
    <section id="prd-builder" className="relative scroll-mt-20 py-12 sm:py-14 lg:py-20">
      <div className="absolute left-1/2 top-0 h-96 w-[min(800px,100vw)] -translate-x-1/2 rounded-full bg-primary/5 blur-[140px] hidden lg:block" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-foreground/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <FileText className="h-3 w-3" />
              Beta
            </span>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Dari ide jadi PRD dalam hitungan menit
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
            Ubah ide mentah menjadi dokumen produk yang jelas, terstruktur, dan siap dibangun.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-px overflow-hidden border border-foreground/10 bg-foreground/10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Hero Card - spans 2 cols on lg */}
          <Reveal from="up" className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <div className="group relative h-full overflow-hidden border border-transparent bg-background p-6 transition-colors hover:border-foreground/25 sm:p-8">
              <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
              <div className="relative space-y-4">
                <h3 className="text-xl font-bold text-foreground sm:text-2xl">
                  AI yang memahami visimu
                </h3>
                <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Ceritakan idemu, AI akan menanyakan hal-hal penting, merekomendasikan teknologi, menyusun struktur produk, sampai PRD siap pakai. Semua bagiannya bisa diedit.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/prd-builder')}
                  className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:gap-3"
                >
                  Coba sekarang
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              {/* Mini PRD preview */}
              <div className="relative mt-8 overflow-hidden rounded-2xl border border-border/50 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b border-border/50 bg-muted/40 px-3 py-2">
                  <span className="flex gap-1" aria-hidden="true">
                    <span className="size-2 rounded-full bg-foreground/20" />
                    <span className="size-2 rounded-full bg-foreground/20" />
                    <span className="size-2 rounded-full bg-foreground/20" />
                  </span>
                  <span className="ml-1 font-mono text-[10px] text-muted-foreground">prd.md</span>
                </div>
                <div className="space-y-3 p-4">
                  <div className="h-2 w-24 rounded bg-foreground/10" />
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-full rounded bg-foreground/5" />
                    <div className="h-1.5 w-4/5 rounded bg-foreground/5" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-20 rounded bg-foreground/8" />
                    <div className="h-1.5 w-full rounded bg-foreground/5" />
                    <div className="h-1.5 w-3/4 rounded bg-foreground/5" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Step Cards */}
          {steps.map((step, i) => (
            <Reveal key={step.label} from="up" delay={100 + i * 50}>
              <div className="h-full border border-transparent bg-background p-5 transition-colors hover:border-foreground/25">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">{step.label}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Models() {
  const [copied, setCopied] = useState(null)
  const copyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 1200)
    })
  }
  return (
    <section id="models" className="scroll-mt-20 py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal from="up" className="mx-auto max-w-5xl">
          <div className="mb-10 flex flex-col justify-between gap-4 border-b border-foreground/10 pb-6 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Model AI
              </span>
              <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                Beragam model, semua gratis
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
              Pilih model yang paling cocok untuk tiap percakapan.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden border border-foreground/10 bg-foreground/10 sm:grid-cols-2 lg:grid-cols-3">
            {MODELS.map((m) => (
              <ModelCard key={m.id} model={m} copied={copied} onCopy={copyId} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function ModelCard({ model, copied, onCopy }) {
  return (
    <div className="group relative overflow-hidden border border-transparent bg-background p-5 transition-colors duration-200 hover:border-foreground/25">
      {/* Watermark logo: brand glyph besar dan samar di belakang */}
      <img
        src={model.logo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 h-[64%] w-[64%] -translate-y-1/2 object-contain opacity-[0.08]"
      />
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background ring-1 ring-border">
            <img src={model.logo} alt="" className="h-full w-full object-contain" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">{model.provider}</span>
        </div>

        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium text-foreground">{model.label}</h3>
          {model.tagline === 'Baru & eksperimental' && (
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Baru
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-background/80 px-2 py-1 font-mono text-[11px] text-muted-foreground ring-1 ring-border/60">
            {model.id}
          </span>
          <button
            type="button"
            onClick={() => onCopy(model.id)}
            title="Salin id model"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {copied === model.id ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="mt-auto flex items-center">
          <span className="ml-auto text-[10px] font-medium text-emerald-600/90 dark:text-emerald-400/90">
            Free
          </span>
        </div>
      </div>
    </div>
  )
}

function Footer() {
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const linkCls =
    'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-transparent px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/15 hover:text-foreground'

  return (
    <footer className="border-t border-foreground/10 py-6 sm:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full border border-foreground/15">
            <LogoImg className="h-5 w-auto" />
          </span>
          <p className="text-xs text-muted-foreground">
            © 2026 KeyzAI · oleh{' '}
            <a
              href="https://github.com/keyzakyy-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Keyzakyy
            </a>
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          <Link to="/privacy" className={linkCls}>
            Kebijakan Privasi
          </Link>
          <Link to="/terms" className={linkCls}>
            Syarat &amp; Ketentuan
          </Link>
          <Link to="/changelog" className={linkCls}>
            Changelog
          </Link>
          <a
            href="https://github.com/keyzakyy-dev"
            target="_blank"
            rel="noopener noreferrer"
            className={linkCls}
          >
            <GithubMark className="h-3.5 w-3.5" />
            GitHub
          </a>
          <button type="button" onClick={toTop} className={linkCls}>
            Ke atas
            <ArrowUp className="h-3 w-3" />
          </button>
        </nav>
      </div>
    </footer>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
  usePageMeta({ title: SITE_NAME, description: SITE_DESC, path: '/' })

  return (
    <div className="relative min-h-dvh bg-background text-foreground antialiased">
      <div className="relative">
        <Navbar navigate={navigate} />
        <main>
          <Hero navigate={navigate} />
          <ModelMarqueeSection />
          <FeaturesBento />
          <PrdBuilder navigate={navigate} />
          <Models />
        </main>
        <Footer />
      </div>
    </div>
  )
}
