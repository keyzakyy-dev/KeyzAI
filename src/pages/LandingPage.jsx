import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../lib/use-theme'
import { usePageMeta, SITE_NAME, SITE_DESC } from '../lib/seo'
import { Reveal } from '../lib/reveal'
import { useAuth } from '../hooks/useAuth'
import { LogoImg } from '../lib/logo-img'
import { ModelMarquee } from '../components/ModelMarquee'
import { ThemeIcon } from '../components/theme-icon'
import { MODELS } from '../lib/models'
import { ArrowRight, ArrowUp, MessageSquare, Code, Pencil, Lock, BookOpen, CircleHelp, Menu, X, FileText, Copy, Check } from 'lucide-react'
import { MeshCanvas } from '../components/MeshCanvas'

// motion menambah ~40 kB gz. Section fitur ada di bawah fold, jadi di-load
// terpisah supaya bundle awal landing page tidak ikut berat.
const FeaturesWithPanel = lazy(() =>
  import('../components/ui/features-with-panel').then((m) => ({ default: m.FeaturesWithPanel }))
)

function GithubMark({ className, ...props }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}




// Mock untuk panel media section fitur. Semuanya pakai token tema
// (border/muted/foreground) supaya ikut light-dark tanpa warna hardcode.
// Padding sengaja rapat: panelnya max-w-md, mock yang lega akan wrap atau
// exceed tinggi kotak.
const Media = ({ children }) => (
  <div className="flex h-full w-full items-center justify-center bg-muted/30 p-4 sm:p-5">
    <div className="w-full max-w-xs">{children}</div>
  </div>
)

// Bentuk ringkas dari mock chat: chrome + satu putaran bubble dan kontrolnya.
// Dipakai di panel fitur yang jauh lebih pendek dari mockup hero, jadi bagian
// yang dipangkas hanya chrome yang redundant.
function MockChat() {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="space-y-2.5 p-3">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-lg bg-primary px-2.5 py-1.5 text-[11px] text-primary-foreground">
            Kenapa error ini muncul terus?
          </div>
        </div>
        <div className="flex gap-2">
          <div className="size-5 shrink-0 rounded-full border border-border" />
          <div className="max-w-[88%] space-y-1.5">
            <div className="rounded-lg bg-muted px-2.5 py-1.5 text-[11px] leading-relaxed text-foreground">
              karena <span className="font-mono">data</span> belum dimuat saat komponen
              dirender. Taruh pemanggilan di dalam{' '}
              <span className="font-mono">useEffect</span>.
            </div>
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <span className="rounded-full border border-border bg-background px-1 py-px">
                1 / 2
              </span>
              <span className="rounded-full border border-border bg-background px-1 py-px">
                buat ulang
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MockWriting() {
  return (
    <div className="space-y-2.5">
      <p className="font-display text-sm font-semibold text-foreground">Draf: follow-up klien</p>
      {['Hai Bu Rina,', 'Terima kasih sudah sempat menyempatkan waktu kemarin. Saya kirim revisi', 'ringkasannya. Mohon dicek bagian harga sebelum kita lanjut.'].map((t, i) => (
        <p key={i} className="text-xs leading-relaxed text-muted-foreground">{t}</p>
      ))}
      <div className="flex gap-1.5 pt-1">
        {['Nada: ramah', 'Singkat', 'Butuh tweak'].map((t) => (
          <span key={t} className="rounded-md bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground ring-1 ring-border">
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function MockCode() {
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg bg-muted/60 font-mono text-[11px] leading-relaxed">
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-1.5 text-[10px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-muted-foreground/30" />
          app.js
        </div>
        <div className="space-y-0.5 p-3 text-foreground">
          <div><span className="text-muted-foreground">1</span> <span className="text-muted-foreground">const</span> user = users.find(</div>
          <div><span className="text-muted-foreground">2</span>   (u) =&gt; u.id === id</div>
          <div className="text-destructive"><span className="text-muted-foreground">3</span> );</div>
        </div>
      </div>
      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-foreground text-[9px] text-background">i</span>
        <span><span className="font-medium text-foreground">Penyebab:</span> find() bisa mengembalikan undefined. Pakai <span className="font-mono">?? null</span> lalu cek sebelum akses.</span>
      </p>
    </div>
  )
}

function MockTopic() {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium text-foreground">Neural network, dari nol</p>
      {[
        ['1. Input', 'Data mentah masuk lewat neuron pertama.'],
        ['2. Bobot', 'Setiap koneksi punya angka yang mengatur seberapa kuat sinyal.'],
        ['3. Output', 'Prediksi terbentuk dari kombinasi semua bobot.'],
      ].map(([t, d]) => (
        <div key={t} className="rounded-lg border border-border bg-background/60 px-3 py-2">
          <p className="text-[11px] font-medium text-foreground">{t}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{d}</p>
        </div>
      ))}
    </div>
  )
}

function MockLearn() {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium text-foreground">Persamaan kuadrat, langkah 2 dari 4</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 rounded-full bg-foreground" />
      </div>
      {['ax² + bx + c = 0', 'Hitung discriminant: b² − 4ac', 'Tentukan akar dari nilainya', 'Tulis bentuk akhir'].map((s, i) => (
        <div key={s} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] ${i < 2 ? 'bg-background/60 text-muted-foreground' : 'text-muted-foreground/50'}`}>
          {i < 2 ? (
            <Check className="size-3 shrink-0 text-foreground" />
          ) : (
            <span className="size-3 shrink-0 rounded-full border border-border" />
          )}
          {s}
        </div>
      ))}
    </div>
  )
}

function MockPrivacy() {
  return (
    <div className="space-y-2">
      {['Tanpa pelacakan', 'Tanpa penjualan data', 'Riwayat di perangkatmu'].map((t) => (
        <div key={t} className="flex items-center gap-2.5 rounded-lg border border-border bg-background/60 px-3 py-2.5">
          <Lock className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs text-foreground">{t}</span>
        </div>
      ))}
    </div>
  )
}

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Tanya apa saja',
    desc: 'Jawaban cepat untuk pertanyaan apa pun.',
    prompt: 'Apa itu bunga berbunga, dijelaskan dengan sederhana?',
    media: <Media><MockChat /></Media>,
  },
  {
    icon: Pencil,
    title: 'Menulis lebih cepat',
    desc: 'Draf email, esai, dan konten sesuai gayamu.',
    prompt: 'Tulis email follow-up yang ramah ke klien yang menghilang.',
    media: <Media><MockWriting /></Media>,
  },
  {
    icon: Code,
    title: 'Debug kode',
    desc: 'Tempel kode, dapat penjelasan dan perbaikan.',
    prompt: 'Kenapa ini error "cannot read property of undefined"?',
    media: <Media><MockCode /></Media>,
  },
  {
    icon: BookOpen,
    title: 'Pelajari topik baru',
    desc: 'Topik rumit jadi penjelasan sederhana.',
    prompt: 'Jelaskan cara kerja neural network untuk pemula.',
    media: <Media><MockTopic /></Media>,
  },
  {
    icon: CircleHelp,
    title: 'Bantu belajar',
    desc: 'Langkah demi langkah sampai paham.',
    prompt: 'Bantu aku pahami persamaan kuadrat dari nol.',
    media: <Media><MockLearn /></Media>,
  },
  {
    icon: Lock,
    title: 'Privat & aman',
    desc: 'Tanpa pelacakan, tanpa penjualan data.',
    media: <Media><MockPrivacy /></Media>,
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
    'inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-transparent transition-colors duration-300 ${
        open ? 'border-border/70 bg-background' : ''
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
            <ThemeIcon theme={theme} />
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
            <ThemeIcon theme={theme} />
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

function Hero({ navigate }) {
  return (
    /* Tinggi = viewport dikurangi header fixed (h-16) supaya isi hero tepat
       satu layar tanpa memaksa scroll. Kolom kanan sengaja kosong — mesh
       heksagon di belakang mengisi ruang itu, mockup sudah dihapus. */
    <section className="relative overflow-hidden py-16 sm:py-20 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center lg:py-24">
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
        {/* Kolom kiri 6/12 di tablet, 5/12 di xl — 5/12 bikin heading 3.5rem
            jadi terlalu banyak baris di tablet. Kolom kanan jadi 6/7. */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-6 xl:col-span-5">
            <a
              href="#models"
              className="animate-rise group mb-6 inline-flex max-w-full items-center gap-2.5 rounded-full border border-border bg-card/85 py-1.5 pl-1.5 pr-4 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:border-foreground/40"
            >
              <span className="shrink-0 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white dark:bg-emerald-400/90 dark:text-emerald-950">
                Free
              </span>
              <span className="truncate text-muted-foreground">
                Semua model gratis, tanpa kartu kredit
              </span>
              <ArrowRight
                className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>

            <h1
              className="animate-rise text-balance text-[2.25rem] font-bold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[3.5rem]"
              style={{ animationDelay: '60ms' }}
            >
              Semua model AI gratis, dalam satu chat.
            </h1>

            <p
              className="animate-rise mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
              style={{ animationDelay: '140ms' }}
            >
              Tulis, debug, dan belajar tanpa pindah aplikasi. Edit pesan atau
              buat ulang jawaban kapan saja — versi lama tetap bisa dibuka.
            </p>

            <div
              className="animate-rise mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: '220ms' }}
            >
              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
              >
                Buka chat
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
              <a
                href="#prd-builder"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-card px-5 text-[15px] font-semibold text-foreground transition-colors hover:border-foreground/40"
              >
                Dari ide jadi PRD
              </a>
            </div>

            <ul
              className="animate-rise mt-10 flex flex-col gap-3 text-sm font-medium text-muted-foreground"
              style={{ animationDelay: '300ms' }}
            >
              {[
                'Masuk dengan Google, riwayat otomatis tersimpan',
                'Jawaban mengalir saat diketik, tidak perlu ditunggu',
                'Bisa ganti model kapan saja',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    className="mt-px grid size-4 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
                    aria-hidden="true"
                  >
                    <Check className="size-2.5" />
                  </span>
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom kanan: marquee model gratis — membuktikan klaim "semua model
              gratis" di headline, bukan sekadar kebetulan. Delay 200ms
              sesuai pola stagger hero: kolom kanan muncul sebelum checklist. */}
          <div
            className="animate-rise mt-12 hidden lg:col-span-6 lg:mt-0 lg:block xl:col-span-7"
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex h-full items-center">
              <ModelMarquee />
            </div>
          </div>
        </div>
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

            {/* Pipeline preview: horizontal flow of 5 steps */}
            <div className="flex flex-wrap items-center gap-1">
              {steps.map((s, i) => (
                <div key={s.label} className="flex items-center gap-1">
                  <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 py-1.5">
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
              <FileText className="h-4 w-4" aria-hidden="true" />
              Coba PRD Builder
              <ArrowRight className="h-4 w-4" />
            </button>
          </Reveal>

          {/* Right: PRD document mockup, shell window yang sama dengan mock chat */}
          <Reveal from="up" delay={150} className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2.5">
                <span className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="size-2.5 rounded-full bg-destructive/75 ring-1 ring-foreground/10" />
                  <span className="size-2.5 rounded-full bg-foreground/15 ring-1 ring-foreground/10" />
                  <span className="size-2.5 rounded-full bg-foreground/25 ring-1 ring-foreground/10" />
                </span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">prd.md</span>
              </div>
              <div className="flex min-h-[22rem] flex-col justify-center space-y-4 p-5">
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
            <span className="inline-flex items-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-colors duration-200 hover:border-foreground/30 hover:bg-accent/50">
      {/* Watermark logo: brand glyph besar dan samar di belakang */}
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
    <div className="relative min-h-dvh bg-background text-foreground antialiased">
      <MeshCanvas
        parallax
        label="Decorative background: full-page honeycomb that drifts with scroll, bends around the cursor, and ripples on click."
        className="pointer-events-none fixed inset-0"
      />
      <div className="relative">
        <Navbar navigate={navigate} theme={theme} toggleTheme={toggleTheme} />
        <main>
          <Hero navigate={navigate} />
          {/* List fitur + panel media. Glow blob dibungkus di luar karena
              komponennya sendiri sudah membawa <section>-nya. Padding
              fallback disamakan dengan section aslinya supaya tidak ada
              layout shift sewaktu chunk motion selesai di-load. */}
          <Suspense
            fallback={
              <div className="py-12 sm:py-14 lg:py-16" aria-hidden="true" />
            }
          >
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/4 hidden h-72 w-[min(600px,100vw)] -translate-x-1/2 rounded-full bg-foreground/5 blur-[120px] lg:block"
              />
              <FeaturesWithPanel
                id="features"
                items={FEATURES}
                title="Tulis, kode, belajar"
                kicker="Fitur"
              />
            </div>
          </Suspense>
          <PrdBuilder navigate={navigate} />
          <Models navigate={navigate} />
        </main>
        <Footer />
      </div>
    </div>
  )
}
