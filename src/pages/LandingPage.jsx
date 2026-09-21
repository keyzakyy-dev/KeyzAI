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
import { ArrowRight, ArrowUp, MessageSquare, Code, Pencil, Lock, BookOpen, CircleHelp, Plus, Menu, X, Sun, Moon, Sparkles, FileText } from 'lucide-react'

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
    desc: 'Dari fakta singkat sampai pertanyaan mendalam, dapat jawaban yang tepat dan rapi dalam hitungan detik.',
    prompt: 'Apa itu bunga berbunga, dijelaskan dengan sederhana?',
  },
  {
    icon: Pencil,
    title: 'Menulis lebih cepat',
    desc: 'Draf email, esai, dan konten dengan AI yang mengikuti gaya tulisanmu.',
    prompt: 'Tulis email follow-up yang ramah ke klien yang menghilang.',
  },
  {
    icon: Code,
    title: 'Debug kode',
    desc: 'Tempel snippet, langsung dapat penjelasan error dan perbaikan.',
    prompt: 'Kenapa ini error "cannot read property of undefined"?',
  },
  {
    icon: BookOpen,
    title: 'Pelajari topik baru',
    desc: 'Pecah topik rumit menjadi penjelasan sederhana yang mudah dipahami.',
    prompt: 'Jelaskan cara kerja neural network untuk pemula.',
  },
  {
    icon: CircleHelp,
    title: 'Bantu belajar',
    desc: 'Langkah demi langkah untuk soal dan konsep yang bikin mentok.',
    prompt: 'Bantu aku pahami persamaan kuadrat dari nol.',
  },
  {
    icon: Lock,
    title: 'Privat & aman',
    desc: 'Percakapanmu milikmu. Kami tidak melacak atau menjual datamu.',
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
  const [scrolled, setScrolled] = useState(false)
  const progressRef = useRef(null)

  // Satu listener untuk semua: status scroll, progress baca, dan scroll-spy.
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12)

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
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled || open
          ? 'border-border/70 bg-background/95 backdrop-blur'
          : 'border-transparent'
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
    <section className="relative overflow-hidden pb-12 pt-24 sm:pb-14 sm:pt-32 lg:pb-16 lg:pt-36">
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
    <section id="features" className="scroll-mt-20 py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal from="up" className="mx-auto grid max-w-5xl gap-x-10 gap-y-1 md:grid-cols-2">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            const inner = (
              <>
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground sm:text-[15px]">{f.title}</span>
                </span>
                <span className="mt-1 block pl-[26px] text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {f.desc}
                </span>
                {f.prompt && (
                  <ArrowRight className="absolute top-[19px] right-3 h-4 w-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                )}
              </>
            )
            const collapsed = i >= 3 && !showAll
            const base = `group relative -mx-3 flex w-full flex-col rounded-lg px-3 py-3 text-left ${
              collapsed ? 'hidden md:flex' : ''
            }`
            return f.prompt ? (
              <button key={f.title} type="button" onClick={() => onPrompt(f.prompt)} className={`${base} transition-colors hover:bg-accent/40`}>
                {inner}
              </button>
            ) : (
              <div key={f.title} className={base}>
                {inner}
              </div>
            )
          })}
        </Reveal>

        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mx-auto mt-6 flex min-h-11 items-center gap-1.5 rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:hidden"
        >
          {showAll ? 'Sembunyikan' : 'Lihat fitur lainnya'}
          <Plus className={`h-4 w-4 transition-transform duration-300 ${showAll ? 'rotate-45' : ''}`} />
        </button>
      </div>
    </section>
  )
}

function PrdBuilder({ navigate }) {
  return (
    <section id="prd-builder" className="scroll-mt-20 border-t border-border/60 py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal from="up" className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Beta
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dari ide jadi PRD dalam hitungan menit
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Ceritakan idemu, AI akan menanyakan hal-hal penting, merekomendasikan teknologi, menyusun struktur produk, sampai PRD siap pakai. Semua bagiannya bisa diedit.
          </p>
          <button
            type="button"
            onClick={() => navigate('/prd-builder')}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" />
            Coba PRD Builder
            <ArrowRight className="h-4 w-4" />
          </button>
        </Reveal>
      </div>
    </section>
  )
}

function Models({ navigate }) {
  return (
    <section id="models" className="scroll-mt-20 border-t border-border/60 py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal from="up" className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Model AI
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Beragam model, semua gratis
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Pilih model yang paling cocok untuk tiap percakapan.
          </p>
        </Reveal>

        <Reveal from="up" delay={80} className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => navigate('/chat')}
              className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-foreground/40 hover:shadow-md"
            >
              <span className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background ring-1 ring-border">
                    <img src={m.logo} alt="" className="h-full w-full object-contain" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{m.label}</span>
                </span>
                {m.free && (
                  <span className="text-[10px] font-medium text-emerald-600/90 dark:text-emerald-400/90">
                    Free
                  </span>
                )}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">{m.id}</span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Buka chat
                <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function Footer() {
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const linkCls =
    'inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'

  return (
    <footer className="border-t border-border">
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
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Navbar navigate={navigate} theme={theme} toggleTheme={toggleTheme} />
      <main>
        <Hero navigate={navigate} />
        <Features navigate={navigate} />
        <PrdBuilder navigate={navigate} />
        <Models navigate={navigate} />
      </main>
      <Footer />
    </div>
  )
}
