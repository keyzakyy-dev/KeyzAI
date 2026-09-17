import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { useTheme } from '../lib/use-theme'
import { usePageMeta, SITE_NAME, SITE_DESC, faqSchema, injectJsonLd } from '../lib/seo'
import { Reveal } from '../lib/reveal'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo.png'
import { ChatMock } from '../components/ChatMock'
import {
  ArrowRight, ArrowUp, Github, MessageSquare, MessageCircle, Code2, PenLine,
  ShieldCheck, BookOpen, GraduationCap, Plus, Menu, X, Sun, Moon,
} from 'lucide-react'

const NAV_LINKS = [
  { label: 'Fitur', href: '#features' },
  { label: 'FAQ', href: '#faq' },
]

const STATS = [
  { value: 'Rp0', label: 'Biaya untuk memulai' },
  { value: '1 klik', label: 'Masuk dengan Google' },
  { value: '24/7', label: 'Selalu bisa diakses' },
  { value: 'Tersinkron', label: 'Riwayat di semua perangkat' },
]

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Tanya apa saja',
    desc: 'Dari fakta singkat sampai pertanyaan mendalam — dapat jawaban tepat dan rapi dalam hitungan detik.',
    prompt: 'Apa itu bunga berbunga, dijelaskan dengan sederhana?',
  },
  {
    icon: PenLine,
    title: 'Menulis lebih cepat',
    desc: 'Draf email, esai, dan konten dengan AI yang mengikuti gaya tulisanmu.',
    prompt: 'Tulis email follow-up yang ramah ke klien yang menghilang.',
  },
  {
    icon: Code2,
    title: 'Debug kode',
    desc: 'Tempel snippet, langsung dapat perbaikan, penjelasan, dan optimasi.',
    prompt: 'Kenapa ini error "cannot read property of undefined"?',
  },
  {
    icon: BookOpen,
    title: 'Pelajari topik baru',
    desc: 'Pecah topik rumit menjadi penjelasan sederhana yang mudah dipahami.',
    prompt: 'Jelaskan cara kerja neural network untuk pemula.',
  },
  {
    icon: GraduationCap,
    title: 'Bantu belajar',
    desc: 'Langkah demi langkah untuk soal dan konsep yang bikin mentok.',
    prompt: 'Bantu aku pahami persamaan kuadrat dari nol.',
  },
  {
    icon: ShieldCheck,
    title: 'Privat & aman',
    desc: 'Percakapanmu milikmu. Tanpa pelacakan, tanpa jual data.',
  },
]

const FAQS = [
  {
    q: 'KeyzAI benar-benar gratis?',
    a: 'Iya. KeyzAI sepenuhnya gratis — tanpa langganan, tanpa biaya tersembunyi, tanpa kartu kredit. Masuk dan mulai bertanya.',
  },
  {
    q: 'Harus bikin akun dulu?',
    a: 'Kamu masuk sekali dengan akun Google — tidak perlu bikin password baru. Ini agar riwayat percakapanmu tersimpan dan bisa kamu lanjutkan dari perangkat mana pun.',
  },
  {
    q: 'Boleh tanya apa saja?',
    a: 'Apa saja. Brainstorm ide bisnis, debug kode, rencanakan perjalanan, pahami konsep, draf email, atau sekadar ngobrol. Selama bisa diketik, KeyzAI bisa bantu.',
  },
  {
    q: 'Data percakapanku aman?',
    a: 'Riwayat tersimpan di akunmu dan hanya bisa diakses setelah login. Pesan yang kamu kirim diteruskan ke model AI pihak ketiga untuk diproses menjadi respons — dan tidak kami jual ke siapa pun.',
  },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src={logo} alt="KeyzAI" className="h-8 w-auto" />
    </div>
  )
}

function Navbar({ navigate, theme, toggleTheme }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')
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

      // scroll-spy: section terakhir yang sudah melewati garis 140px dari atas viewport
      const line = window.scrollY + 140
      let current = ''
      for (const link of NAV_LINKS) {
        const el = document.getElementById(link.href.slice(1))
        if (el && el.getBoundingClientRect().top + window.scrollY <= line) current = link.href
      }
      setActive(current)
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

  const linkClass = (href) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
      active === href
        ? 'bg-card text-foreground shadow-sm shadow-black/5'
        : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Hairline progress baca */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] overflow-hidden" aria-hidden="true">
        <div
          ref={progressRef}
          className="h-full w-full origin-left scale-x-0 bg-primary"
        />
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div
          className={`mt-2 overflow-hidden rounded-2xl border transition-all duration-300 sm:mt-3 ${
            scrolled
              ? 'border-border bg-background/85 shadow-xl shadow-black/5 backdrop-blur-xl dark:shadow-black/40'
              : 'border-border/60 bg-background/60 backdrop-blur-md'
          }`}
        >
          <nav className="flex h-14 items-center justify-between gap-2 px-2.5 sm:h-[60px] sm:px-3">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Kembali ke atas"
              className="shrink-0 rounded-xl transition-opacity hover:opacity-80"
            >
              <Logo />
            </button>

            {/* Segmented links (desktop) */}
            <div className="hidden items-center gap-0.5 rounded-full border border-border/70 bg-muted/40 p-1 md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={linkClass(link.href)}
                  aria-current={active === link.href ? 'true' : undefined}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="hidden shrink-0 items-center gap-1.5 md:flex">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Ganti tema"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />
              {user ? (
                <Button onClick={() => navigate('/chat')} className="group h-9 rounded-full pl-4 pr-3.5 shadow-sm">
                  Buka chat
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/chat')}
                  className="group h-9 rounded-full pl-4 pr-3.5 shadow-sm"
                >
                  Masuk
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5 md:hidden">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Ganti tema"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={open}
                aria-controls="landing-mobile-nav"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-colors hover:bg-accent"
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
          </nav>

          {/* Panel menu mobile */}
          {open && (
            <div
              id="landing-mobile-nav"
              className="animate-fade-up border-t border-border/70 px-2.5 pb-3 pt-2 md:hidden"
              style={{ animationDuration: '220ms' }}
            >
              <div className="space-y-0.5">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active === link.href
                        ? 'bg-card text-foreground shadow-sm shadow-black/5'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    }`}
                  >
                    {link.label}
                    <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                  </a>
                ))}
              </div>
              <Button
                onClick={() => {
                  setOpen(false)
                  navigate('/chat')
                }}
                className="mt-2 h-10 w-full rounded-xl"
              >
                {user ? 'Buka chat' : 'Masuk dengan Google'}
                <ArrowRight />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function Hero({ navigate }) {
  return (
    <section className="relative overflow-hidden pb-10 pt-24 sm:pb-14 sm:pt-32 lg:pb-16 lg:pt-36">
      <div className="absolute inset-0 bg-dots [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]" />
      <div className="absolute left-1/2 top-0 h-56 w-[min(520px,100vw)] -translate-x-1/2 rounded-full bg-foreground/5 blur-[100px] sm:h-72 sm:w-[700px] sm:blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 sm:gap-16 lg:grid-cols-2">
          <div className="space-y-6 sm:space-y-8">
            <h1
              className="animate-fade-up text-[34px] font-bold leading-[1.08] tracking-tighter text-foreground sm:text-5xl md:text-6xl xl:text-7xl"
              style={{ animationDelay: '0.1s' }}
            >
              Tanya apa saja.
              <br />
              Dapat jawabannya.
            </h1>

            <p className="animate-fade-up max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg" style={{ animationDelay: '0.2s' }}>
              Jawaban AI cepat, rapi, dan gratis.
            </p>

            <div className="animate-fade-up space-y-3" style={{ animationDelay: '0.25s' }}>
              <Button
                onClick={() => navigate('/chat')}
                size="lg"
                className="group h-12 rounded-full pl-6 pr-5 text-base shadow-sm"
              >
                Mulai chat
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <p className="text-xs text-muted-foreground/70">
                Gratis. Masuk dengan Google.
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <ChatMock />
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon: Icon, title, desc, prompt, onPrompt }) {
  const content = (
    <div className="relative">
      <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <h3 className="mb-1.5 text-base sm:text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
      {prompt && (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-foreground">
          Coba <ArrowRight className="h-3 w-3" />
        </span>
      )}
    </div>
  )

  const className = `group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-6 text-left transition-colors hover:bg-accent/40`

  if (prompt && onPrompt) {
    return (
      <button type="button" onClick={() => onPrompt(prompt)} className={className}>
        {content}
      </button>
    )
  }
  return <div className={className}>{content}</div>
}

function Features({ navigate }) {
  const onPrompt = (p) => navigate(`/chat?q=${encodeURIComponent(p)}`)
  return (
    <section id="features" className="scroll-mt-20 py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal from="up" className="mx-auto mb-8 sm:mb-12 max-w-2xl space-y-4 text-center">
          <span className="inline-block rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            Fitur
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-foreground md:text-5xl">
            Satu AI, kemungkinan tanpa batas
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Semua yang kamu butuhkan untuk berpikir, menciptakan, dan belajar lebih cepat — dalam satu antarmuka yang rapi.
          </p>
        </Reveal>

        <Reveal from="up" className="mx-auto mb-10 sm:mb-14 grid max-w-3xl grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="space-y-1 text-center">
              <p className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </Reveal>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} from="tilt" delay={i * 90} className="h-full">
              <FeatureCard {...f} onPrompt={onPrompt} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQ({ navigate }) {
  return (
    <section id="faq" className="relative scroll-mt-20 overflow-hidden py-10 sm:py-14 lg:py-16">
      <div className="relative mx-auto grid max-w-7xl gap-10 sm:gap-14 px-4 sm:px-6 lg:grid-cols-[1fr,1.35fr] lg:gap-20">
        {/* Left: heading + support card */}
        <Reveal from="left" className="lg:sticky lg:top-28 lg:self-start">
          <Reveal from="up" className="space-y-4">
            <span className="inline-block rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-foreground md:text-5xl">
              Pertanyaan yang sering diajukan
            </h2>
            <p className="max-w-md text-base sm:text-lg text-muted-foreground">
              Semua yang perlu kamu tahu soal KeyzAI. Nggak nemu jawabannya? Tanya saja —
              AI-nya selalu siap bantu.
            </p>
          </Reveal>

          <Reveal from="up" delay={150} className="relative mt-10 overflow-hidden rounded-2xl border border-border bg-card p-6">
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                <MessageCircle className="h-5 w-5 text-foreground" />
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
                    Masih ada pertanyaan?
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Dapat jawaban instan dari AI — tanpa antre, tanpa tiket, aktif 24/7.
                  </p>
                </div>
                <Button onClick={() => navigate('/chat')} size="sm">
                  Mulai chat
                  <ArrowRight />
                </Button>
              </div>
            </div>
          </Reveal>
        </Reveal>

        {/* Right: accordion */}
        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} from="right" delay={i * 90} as="div">
              <details
                className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 open:border-primary/30 open:shadow-md"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 transition-colors hover:bg-accent/40 [&::-webkit-details-marker]:hidden">
                  <span className="font-heading text-sm font-semibold text-foreground md:text-base">
                    {item.q}
                  </span>
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted transition-all duration-300 group-open:rotate-45 group-open:border-primary/40 group-open:bg-primary group-open:text-primary-foreground">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </summary>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div className="h-px bg-border" />
                  <p className="pt-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const linkCls =
    'inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="KeyzAI" className="h-6 w-auto" />
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
          <a
            href="https://github.com/keyzakyy-dev"
            target="_blank"
            rel="noopener noreferrer"
            className={linkCls}
          >
            <Github className="h-3.5 w-3.5" />
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

  useEffect(() => {
    injectJsonLd(faqSchema(FAQS))
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Navbar navigate={navigate} theme={theme} toggleTheme={toggleTheme} />
      <main>
        <Hero navigate={navigate} />
        <Features navigate={navigate} />
        <FAQ navigate={navigate} />
      </main>
      <Footer />
    </div>
  )
}
