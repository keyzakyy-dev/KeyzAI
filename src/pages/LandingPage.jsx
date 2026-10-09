import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePageMeta, SITE_NAME, SITE_DESC } from '../lib/seo'
import { Reveal } from '../lib/reveal'
import { useAuth } from '../hooks/useAuth'
import { Wordmark } from '../lib/logo-img'
import { ModelMarquee } from '../components/ModelMarquee'
import { MODELS } from '../lib/models'
import {
  ArrowRight,
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
import { ChatMockup } from '../components/landing/ChatMockup'
import { FeaturesBento } from '../components/landing/FeaturesBento'
import { Footer } from '../components/landing/Footer'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <Wordmark />
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
    'inline-flex h-9 items-center gap-1.5 border border-foreground/15 bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/[0.04]'

  return (
    <header
      className={`absolute inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        open ? 'border-foreground/10 bg-background/95 backdrop-blur-md' : 'border-transparent'
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
          className="shrink-0 transition-opacity hover:opacity-80"
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
            className="relative flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:bg-foreground/[0.06]"
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
          className="animate-fade-up border-t border-foreground/10 md:hidden"
          style={{ animationDuration: '220ms' }}
        >
          <nav className="mx-auto max-w-7xl px-4 pb-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate('/chat')
              }}
              className="my-3 h-11 w-full bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
  const meshRef = useRef(null)

  // Parallax: mesh bergeser 20% dari kecepatan scroll (lebih lambat dari
  // konten). Ditulis langsung ke DOM via rAF, tanpa re-render. Hero di
  // puncak halaman, jadi tepi atas mesh selalu di luar viewport — tanpa
  // gap. Dihormati prefers-reduced-motion.
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
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    /* Tinggi = viewport dikurangi header fixed (h-16) supaya isi hero tepat
       satu layar tanpa memaksa scroll. Kolom kanan berisi mockup chat TUI
       yang dekoratif (disembunyikan di mobile). */
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
          <div className="min-w-0 lg:col-span-6 xl:col-span-5">
            <a
              href="#models"
              className="animate-rise group mb-5 inline-flex max-w-full items-center gap-2 border border-foreground/15 bg-transparent py-1 pl-1.5 pr-3 text-xs text-foreground transition-colors hover:border-foreground/35 sm:mb-6 sm:gap-3 sm:py-1.5 sm:pl-2 sm:pr-3.5 sm:text-sm"
            >
              <span className="flex size-5 shrink-0 items-center justify-center border border-yellow-400/35 text-yellow-600 dark:text-yellow-400 sm:size-6">
                <Check className="size-3 sm:size-3.5" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="truncate text-muted-foreground">
                <strong className="font-medium text-foreground">Gratis untuk semua.</strong>{' '}
                Tanpa kartu kredit
              </span>
              <ArrowRight
                className="size-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:size-3.5"
                aria-hidden="true"
              />
            </a>

            <h1
              className="animate-rise text-balance text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-[4.5rem]"
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
                className="group inline-flex h-11 items-center justify-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_hsl(var(--foreground)/0.12)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_10px_28px_hsl(var(--foreground)/0.18)] sm:h-12 sm:px-6 sm:text-[15px]"
              >
                Buka chat
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
              <a
                href="#prd-builder"
                className="inline-flex h-11 items-center justify-center border border-foreground/15 bg-transparent px-5 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-foreground/40 hover:bg-foreground/[0.04] sm:h-12 sm:px-6 sm:text-[15px]"
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
                  <Check className="size-4 shrink-0 text-yellow-600 dark:text-yellow-400" strokeWidth={2.5} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom kanan: mockup chat TUI (dekoratif, hidden di mobile) */}
          <div className="hidden lg:col-span-6 lg:flex lg:items-center lg:justify-center xl:col-span-7">
            <ChatMockup />
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
          <span className="size-1.5 bg-yellow-400" aria-hidden="true" />
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
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-16 size-64 rounded-full bg-yellow-400/10 blur-[100px] hidden lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-8 size-72 rounded-full bg-yellow-400/10 blur-[100px] hidden lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[32%] -top-16 size-40 rounded-full bg-yellow-400/10 blur-[90px] hidden lg:block" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-foreground/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Beta
            </span>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Dari ide jadi PRD dalam{' '}
              <span className="text-yellow-600 dark:text-yellow-400">hitungan menit</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
            Ubah ide mentah menjadi dokumen produk yang jelas, terstruktur, dan siap dibangun.
          </p>
        </div>

        {/* Bento Grid */}
        <Reveal from="up" className="feature-grid-reveal">
          <div className="feature-grid relative grid grid-cols-2 md:grid-cols-3">
          {/* Hero Card - spans 2 cols on lg */}
          <Reveal from="up" className="col-span-2 sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <div className="feature-card group relative flex h-full flex-col justify-between overflow-hidden p-5 sm:p-8 lg:p-10">
              <div className="relative space-y-4">
                <h3 className="text-xl font-medium text-foreground sm:text-2xl">
                  AI yang memahami visimu
                </h3>
                <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                  Ceritakan idemu, AI akan menanyakan hal-hal penting, merekomendasikan teknologi, menyusun struktur produk, sampai PRD siap pakai. Semua bagiannya bisa diedit.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/prd-builder')}
                  className="mt-4 inline-flex h-10 items-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:mt-6 sm:h-11"
                >
                  Coba sekarang
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Reveal>

          {/* Step Cards */}
          {steps.map((step, i) => (
            <Reveal key={step.label} from="up" delay={100 + i * 50}>
              <div className="feature-card h-full p-4 sm:p-6 md:p-8">
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center text-foreground sm:h-10 sm:w-10">
                    <step.icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                  </div>
                  <h4 className="text-sm font-medium text-foreground sm:text-base md:text-lg">{step.label}</h4>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-5">
                  {step.desc}
                </p>
              </div>
            </Reveal>
          ))}
          </div>
        </Reveal>
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
    <section id="models" className="relative scroll-mt-20 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal from="up" className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 border-b border-foreground/10 pb-6 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Model AI
              </span>
              <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Beragam model,{' '}
                <span className="text-yellow-600 dark:text-yellow-400">semua gratis</span>
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
              Pilih model yang paling cocok untuk tiap percakapan.
            </p>
          </div>

          <div className="feature-grid relative grid grid-cols-1 md:grid-cols-3">
            {MODELS.map((m, index) => (
              <div key={m.id} className="feature-card relative p-7 sm:p-8" style={{ '--card-line-delay': `${index * 100}ms` }}>
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
    <div className="group relative overflow-hidden bg-background transition-colors duration-200">
      {/* Watermark logo: brand glyph besar dan samar di belakang */}
      <img
        src={model.logo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 h-[64%] w-[64%] -translate-y-1/2 object-contain opacity-[0.08]"
      />
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-background ring-1 ring-border">
            <img src={model.logo} alt="" className="h-full w-full object-contain" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">{model.provider}</span>
        </div>

        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium text-foreground">{model.label}</h3>
          {model.tagline === 'Baru & eksperimental' && (
            <span className="bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Baru
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="bg-background/80 px-2 py-1 font-mono text-[11px] text-muted-foreground ring-1 ring-border/60">
            {model.id}
          </span>
          <button
            type="button"
            onClick={() => onCopy(model.id)}
            title="Salin id model"
            className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {copied === model.id ? (
              <Check className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="mt-auto flex items-center">
          <span className="ml-auto text-[10px] font-medium text-yellow-700 dark:text-yellow-400/90">
            Free
          </span>
        </div>
      </div>
    </div>
  )
}

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
          name: 'Apakah KeyzAI gratis?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ya, KeyzAI gratis tanpa kartu kredit. Cukup masuk dengan Google dan mulai chat AI. Semua model AI yang tersedia bisa digunakan tanpa biaya.',
          },
        },
        {
          '@type': 'Question',
          name: 'Model AI apa saja yang tersedia di KeyzAI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'KeyzAI menyediakan multi-model AI termasuk Qwen, DeepSeek, dan Atria. Kamu bisa beralih antar model kapan saja saat chat.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah riwayat chat tersimpan?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ya. Riwayat chat tersinkron otomatis di semua perangkat yang kamu gunakan. Data disimpan di Cloudflare D1 dan dilindungi sesi login Google.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apa itu PRD Builder di KeyzAI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PRD Builder adalah fitur yang mengubah ide aplikasi menjadi Product Requirements Document lengkap. Kamu masuk lewat chat, AI mengklarifikasi detail, merekomendasikan teknologi, dan menyusun struktur produk.',
          },
        },
        {
          '@type': 'Question',
          name: 'Bagaimana cara kerja streaming di KeyzAI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'KeyzAI menggunakan SSE (Server-Sent Events) untuk streaming respons AI langsung saat model menulis, tidak perlu menunggu selesai. Kamu juga bisa berhenti kapan saja dengan tombol stop.',
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
