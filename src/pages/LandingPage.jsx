import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../lib/use-theme'
import { usePageMeta, SITE_NAME, SITE_DESC } from '../lib/seo'
import { Reveal } from '../lib/reveal'
import { useAuth } from '../hooks/useAuth'
import { LogoImg } from '../lib/logo-img'
import { useHeadline } from '../lib/micro-anim'
import { ChatMock } from '../components/ChatMock'
import { MODELS } from '../lib/models'
import { ArrowRight, ArrowUp, MessageSquare, Code, Pencil, Lock, BookOpen, CircleHelp, Plus, Menu, X, Sun, Moon, Sparkles, FileText, Copy, Check } from 'lucide-react'
import { MeshCanvas } from '../components/MeshCanvas'

function GithubMark({ className, ...props }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}




const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Tanya apa saja',
    desc: 'Jawaban cepat untuk pertanyaan apa pun.',
    prompt: 'Apa itu bunga berbunga, dijelaskan dengan sederhana?',
  },
  {
    icon: Pencil,
    title: 'Menulis lebih cepat',
    desc: 'Draf email, esai, dan konten sesuai gayamu.',
    prompt: 'Tulis email follow-up yang ramah ke klien yang menghilang.',
  },
  {
    icon: Code,
    title: 'Debug kode',
    desc: 'Tempel kode, dapat penjelasan dan perbaikan.',
    prompt: 'Kenapa ini error "cannot read property of undefined"?',
  },
  {
    icon: BookOpen,
    title: 'Pelajari topik baru',
    desc: 'Topik rumit jadi penjelasan sederhana.',
    prompt: 'Jelaskan cara kerja neural network untuk pemula.',
  },
  {
    icon: CircleHelp,
    title: 'Bantu belajar',
    desc: 'Langkah demi langkah sampai paham.',
    prompt: 'Bantu aku pahami persamaan kuadrat dari nol.',
  },
  {
    icon: Lock,
    title: 'Privat & aman',
    desc: 'Tanpa pelacakan, tanpa penjualan data.',
  },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoImg className="h-8 w-auto" />
    </div>
  )
}

function Navbar({ navigate, theme, toggleTheme }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const progressRef = useRef(null)

  // Listener untuk progress baca dan scroll-spy.
  useEffect(() => {
    const onScroll = () => {
      // progress baca — ditulis langsung ke DOM agar tidak memicu re-render tiap frame
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
    'inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-transparent transition-colors duration-300 ${
        open ? 'border-border/70 bg-background/95 backdrop-blur' : ''
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
          className="shrink-0 rounded-xl transition-opacity hover:opacity-80"
        >
          <Logo />
        </button>

        {/* Desktop */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ganti tema"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => navigate('/chat')} className={ctaClass}>
            {user ? 'Buka chat' : 'Masuk'}
          </button>
        </div>

        {/* Mobile */}
        <div className="flex shrink-0 items-center gap-1 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ganti tema"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            className="relative flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent"
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
          className="animate-fade-up border-t border-border/70 bg-background md:hidden"
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

function Words({ text }) {
  const words = text.split(' ')
  return words.map((w, i) => (
    <span key={i} className="inline-block opacity-0" data-word>
      {w}
      {i < words.length - 1 ? '\u00A0' : ''}
    </span>
  ))
}

function Hero({ navigate }) {
  const headlineRef = useRef(null)
  useHeadline(headlineRef)
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-center overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="absolute left-1/2 top-0 h-56 w-[min(520px,100vw)] -translate-x-1/2 rounded-full bg-foreground/5 blur-[100px] hidden sm:block sm:h-72 sm:w-[700px] sm:blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 sm:gap-16 lg:grid-cols-2">
          <div className="space-y-6 sm:space-y-8">
            <h1
              ref={headlineRef}
              className="text-[32px] font-bold leading-[1.08] tracking-tighter text-foreground sm:text-5xl md:text-6xl xl:text-6xl"
            >
              <span className="block whitespace-normal sm:whitespace-nowrap">
                <Words text="Tulis, kode, belajar." />
              </span>
              <span className="block whitespace-normal sm:whitespace-nowrap">
                <Words text="Semua dibantuin." />
              </span>
            </h1>

            <p className="animate-fade-up max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg" style={{ animationDelay: '0.8s' }}>
              Jawaban AI cepat, rapi, dan gratis.
            </p>

            <div className="animate-fade-up space-y-2.5" style={{ animationDelay: '0.95s' }}>
              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="group flex w-full max-w-md items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:border-foreground/40"
              >
                <span className="flex-1 truncate text-sm text-muted-foreground transition-colors group-hover:text-foreground sm:text-base">
                  Ketik pertanyaanmu di sini…
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                  <ArrowUp className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>

          <div className="mx-auto hidden w-full max-w-md md:block">
            <ChatMock />
          </div>
        </div>
      </div>
    </section>
  )
}

function Features({ navigate }) {
  const [showAll, setShowAll] = useState(false)
  const onPrompt = (p) => navigate(`/chat?q=${encodeURIComponent(p)}`)
  return (
    <section id="features" className="relative overflow-hidden scroll-mt-20 py-12 sm:py-14 lg:py-16">
      {/* Pola titik halus — CSS only, zero JS */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--foreground)/0.06)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:linear-gradient(to_bottom,#000_50%,transparent_100%)]"
      />
      {/* Soft glow blob — mirip hero tapi lebih lembut */}
      <div className="absolute left-1/2 top-1/4 h-72 w-[min(600px,100vw)] -translate-x-1/2 rounded-full bg-foreground/5 blur-[120px] hidden lg:block" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        <Reveal from="up" className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Fitur
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Tulis, kode, belajar
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              const collapsed = i >= 3 && !showAll
              const cardClass = `group relative flex flex-col rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-5 text-left transition-all duration-200 hover:border-foreground/30 hover:bg-accent/50 hover:-translate-y-0.5 ${
                collapsed ? 'hidden lg:flex' : ''
              }`
              return f.prompt ? (
                <button
                  key={f.title}
                  type="button"
                  onClick={() => onPrompt(f.prompt)}
                  className={cardClass}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-muted-foreground opacity-0 translate-y-1 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100" />
                </button>
              ) : (
                <div key={f.title} className={cardClass}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="mx-auto mt-6 flex min-h-11 items-center gap-1.5 rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            {showAll ? 'Sembunyikan' : 'Lihat fitur lainnya'}
            <Plus className={`h-4 w-4 transition-transform duration-300 ${showAll ? 'rotate-45' : ''}`} />
          </button>
        </Reveal>
      </div>
    </section>
  )
}

function PrdBuilder({ navigate }) {
  const steps = [
    { icon: MessageSquare, label: 'Ide' },
    { icon: CircleHelp, label: 'Klarifikasi' },
    { icon: Code, label: 'Teknologi' },
    { icon: FileText, label: 'Struktur' },
    { icon: FileText, label: 'PRD' },
  ]

  return (
    <section id="prd-builder" className="relative scroll-mt-20 py-12 sm:py-14 lg:py-16">
      {/* Subtle dot grid — CSS only, zero JS */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--foreground)/0.05)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_40%,transparent_70%)]"
      />
      {/* Soft glow blob */}
      <div className="absolute left-1/2 top-0 h-72 w-[min(600px,100vw)] -translate-x-1/2 rounded-full bg-foreground/5 blur-[120px] hidden lg:block" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: headline + pipeline + CTA */}
          <Reveal from="up" className="space-y-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Beta
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Dari ide jadi PRD
              <br />
              <span className="text-muted-foreground">dalam hitungan menit</span>
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Ceritakan idemu, AI akan menanyakan hal-hal penting, merekomendasikan teknologi, menyusun struktur produk, sampai PRD siap pakai. Semua bagiannya bisa diedit.
            </p>

            {/* Pipeline preview — horizontal flow of 5 steps */}
            <div className="flex flex-wrap items-center gap-1">
              {steps.map((s, i) => (
                <div key={s.label} className="flex items-center gap-1">
                  <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/70 px-2.5 py-1.5 backdrop-blur-sm">
                    <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate('/prd-builder')}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Sparkles className="h-4 w-4" />
              Coba PRD Builder
              <ArrowRight className="h-4 w-4" />
            </button>
          </Reveal>

          {/* Right: PRD document mockup */}
          <Reveal from="up" delay={150} className="relative">
            <div className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-sm shadow-xl">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">prd.md</span>
              </div>
              {/* Document body */}
              <div className="mt-4 space-y-4">
                <div>
                  <div className="h-2.5 w-28 rounded bg-foreground/10" />
                  <div className="mt-1.5 h-2 w-44 rounded bg-foreground/8" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full rounded bg-foreground/6" />
                  <div className="h-1.5 w-5/6 rounded bg-foreground/6" />
                  <div className="h-1.5 w-4/6 rounded bg-foreground/6" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-32 rounded bg-foreground/8" />
                  <div className="h-1.5 w-full rounded bg-foreground/6" />
                  <div className="h-1.5 w-3/4 rounded bg-foreground/6" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-28 rounded bg-foreground/8" />
                  <div className="h-1.5 w-full rounded bg-foreground/6" />
                  <div className="h-1.5 w-5/6 rounded bg-foreground/6" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-36 rounded bg-foreground/8" />
                  <div className="h-1.5 w-full rounded bg-foreground/6" />
                  <div className="h-1.5 w-2/3 rounded bg-foreground/6" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Models({ navigate }) {
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
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Model AI
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Beragam model, semua gratis
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base max-w-2xl mx-auto">
              Pilih model yang paling cocok untuk tiap percakapan.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODELS.map((m) => (
              <ModelCard key={m.id} model={m} navigate={navigate} copied={copied} onCopy={copyId} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function ModelCard({ model, navigate, copied, onCopy }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-5 transition-all duration-200 hover:border-foreground/30 hover:bg-accent/50 hover:-translate-y-0.5">
      {/* Watermark logo — brand glyph besar & samar di belakang */}
      <img
        src={model.logo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 h-[70%] w-[70%] -translate-y-1/2 object-contain opacity-[0.15]"
      />
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background ring-1 ring-border">
            <img src={model.logo} alt="" className="h-full w-full object-contain" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">{model.provider}</span>
        </div>

        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-foreground">{model.label}</h3>
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
    'inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'

  return (
    <footer className="py-5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <LogoImg className="h-6 w-auto" />
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

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
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
  const [theme, setTheme] = useTheme()
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  usePageMeta({ title: SITE_NAME, description: SITE_DESC, path: '/' })

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      <MeshCanvas
        parallax
        label="Decorative background: full-page flow field that drifts with scroll."
        className="pointer-events-none fixed inset-0"
      />
      <div className="relative">
        <Navbar navigate={navigate} theme={theme} toggleTheme={toggleTheme} />
        <main>
          <Hero navigate={navigate} />
          <Features navigate={navigate} />
          <PrdBuilder navigate={navigate} />
          <Models navigate={navigate} />
        </main>
        <Footer />
      </div>
    </div>
  )
}
