import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { useTheme } from '../lib/use-theme'
import { usePageMeta, SITE_NAME, SITE_DESC, faqSchema, injectJsonLd } from '../lib/seo'
import { Reveal } from '../lib/reveal'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo.png'
import { ChatMock } from '../components/ChatMock'
import { ArrowRightIcon, ArrowUpIcon, GitHubLogoIcon, ChatBubbleIcon, CodeIcon, Pencil2Icon, LockClosedIcon, ReaderIcon, QuestionMarkIcon, PlusIcon, HamburgerMenuIcon, Cross2Icon, SunIcon, MoonIcon } from '@radix-ui/react-icons'


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
    icon: ChatBubbleIcon,
    title: 'Tanya apa saja',
    desc: 'Dari fakta singkat sampai pertanyaan mendalam — dapat jawaban tepat dan rapi dalam hitungan detik.',
    prompt: 'Apa itu bunga berbunga, dijelaskan dengan sederhana?',
  },
  {
    icon: Pencil2Icon,
    title: 'Menulis lebih cepat',
    desc: 'Draf email, esai, dan konten dengan AI yang mengikuti gaya tulisanmu.',
    prompt: 'Tulis email follow-up yang ramah ke klien yang menghilang.',
  },
  {
    icon: CodeIcon,
    title: 'Debug kode',
    desc: 'Tempel snippet, langsung dapat perbaikan, penjelasan, dan optimasi.',
    prompt: 'Kenapa ini error "cannot read property of undefined"?',
  },
  {
    icon: ReaderIcon,
    title: 'Pelajari topik baru',
    desc: 'Pecah topik rumit menjadi penjelasan sederhana yang mudah dipahami.',
    prompt: 'Jelaskan cara kerja neural network untuk pemula.',
  },
  {
    icon: QuestionMarkIcon,
    title: 'Bantu belajar',
    desc: 'Langkah demi langkah untuk soal dan konsep yang bikin mentok.',
    prompt: 'Bantu aku pahami persamaan kuadrat dari nol.',
  },
  {
    icon: LockClosedIcon,
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
                {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
              </button>
              <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />
              {user ? (
                <Button onClick={() => navigate('/chat')} className="group h-9 rounded-full pl-4 pr-3.5 shadow-sm">
                  Buka chat
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/chat')}
                  className="group h-9 rounded-full pl-4 pr-3.5 shadow-sm"
                >
                  Masuk
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
                {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={open}
                aria-controls="landing-mobile-nav"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-colors hover:bg-accent"
              >
                <HamburgerMenuIcon
                  className={`h-4 w-4 transition-all duration-300 ${
                    open ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                  }`}
                />
                <Cross2Icon
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
                    <ArrowRightIcon className="h-3.5 w-3.5 opacity-40" />
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
                <ArrowRightIcon />
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
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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

function Features({ navigate }) {
  const onPrompt = (p) => navigate(`/chat?q=${encodeURIComponent(p)}`)
  return (
    <section id="features" className="scroll-mt-20 py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal from="up" className="mx-auto mb-8 sm:mb-10 max-w-2xl space-y-4 text-center">
          <h2 className="text-2xl font-bold tracking-tighter text-foreground sm:text-3xl">
            Untuk semua hal, satu tempat
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Berpikir, menciptakan, dan belajar lebih cepat — dalam satu antarmuka yang rapi.
          </p>
        </Reveal>

        <Reveal from="up" className="mx-auto mb-10 grid max-w-3xl grid-cols-2 gap-x-4 gap-y-8 sm:mb-14 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="space-y-1 text-center">
              <p className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </Reveal>

        <Reveal from="up" className="mx-auto grid max-w-5xl gap-x-10 md:grid-cols-2">
          {FEATURES.map((f) => {
            const Icon = f.icon
            const inner = (
              <>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                  <Icon className="h-4 w-4 text-foreground" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground sm:text-base">{f.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {f.desc}
                  </span>
                </span>
                {f.prompt && (
                  <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                )}
              </>
            )
            const rowCls =
              'group -mx-2 flex w-full items-center gap-4 rounded-lg border-t border-border px-2 py-4 text-left transition-colors hover:bg-accent/40 sm:gap-5'
            return f.prompt ? (
              <button key={f.title} type="button" onClick={() => onPrompt(f.prompt)} className={rowCls}>
                {inner}
              </button>
            ) : (
              <div key={f.title} className={rowCls}>
                {inner}
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}

function FAQ({ navigate }) {
  return (
    <section id="faq" className="scroll-mt-20 py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Reveal from="up" className="mb-8 text-center sm:mb-10">
          <h2 className="text-2xl font-bold tracking-tighter text-foreground sm:text-3xl">
            Pertanyaan yang sering diajukan
          </h2>
        </Reveal>

        <Reveal from="up" className="divide-y divide-border border-y border-border">
          {FAQS.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-medium text-foreground">{item.q}</span>
                <PlusIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="pb-4 pr-8 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </Reveal>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Nggak nemu jawabannya?{' '}
          <button
            type="button"
            onClick={() => navigate('/chat')}
            className="group inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
          >
            Tanya saja
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </p>
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
            <GitHubLogoIcon className="h-3.5 w-3.5" />
            GitHub
          </a>
          <button type="button" onClick={toTop} className={linkCls}>
            Ke atas
            <ArrowUpIcon className="h-3 w-3" />
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
