import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { usePageMeta, SITE_NAME, SITE_DESC } from '../lib/seo'
import { MODELS } from '../lib/models'
import { Wordmark } from '../lib/logo-img'
import { useAuth } from '../hooks/useAuth'

/* ─── Hero Canvas: Particle Event Display ────────────────────────────────── */

/**
 * The collision event hero.
 *
 * Concentric detector rings (steel, very faint), a central beam vertex, and
 * 6 curved particle tracks that draw themselves in sequence when the hero
 * comes into view. Yellow tracks = active/main conversation; cyan = branch.
 * Tiny spark particles burst from the vertex. Nothing loops; the event plays
 * once and holds.
 *
 * ponytail: swap Canvas for SVG paths if HiDPI performance is ever an issue
 * — SVG scales naturally and supports direct CSS hover/state on individual tracks.
 */
function EventCanvas({ className = '' }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const [visible, setVisible] = useState(false)

  // Track definitions: { angle, radius, color, curvature, delay, dashLen }
  const TRACKS = [
    { angle: -30, radius: 160, color: '#FFD23A', curvature: 0.6, delay: 300, width: 2 },   // main
    { angle: 10,  radius: 200, color: '#FFD23A', curvature: -0.4, delay: 500, width: 2 },   // main
    { angle: 55,  radius: 140, color: '#35D0FF', curvature: 0.7,  delay: 700, width: 1.5 }, // branch
    { angle: -70, radius: 190, color: '#35D0FF', curvature: -0.5, delay: 900, width: 1.5 }, // branch
    { angle: 120, radius: 170, color: '#FFD23A', curvature: 0.3,  delay: 1100, width: 2 },  // main
    { angle: -130,radius: 220, color: '#35D0FF', curvature: -0.6, delay: 1300, width: 1.5 },// branch
  ]

  const RINGS = [80, 130, 180, 230, 280]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W, H, cx, cy, scale

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      scale = Math.min(window.devicePixelRatio || 1, 2)
      W = rect.width || 600
      H = Math.max(rect.height, 400)
      canvas.width = W * scale
      canvas.height = H * scale
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      cx = W / 2
      cy = H / 2 + 20
    }
    resize()
    window.addEventListener('resize', resize)

    // Spark particles (small dots near vertex)
    const sparks = []
    for (let i = 0; i < 30; i++) {
      sparks.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 1.2,
        life: 0.4 + Math.random() * 0.6,
        maxLife: 1,
        dist: Math.random() * 60,
      })
    }

    const COLORS = {
      vacuum: '#080F14',
      ring: 'rgba(74,96,112,0.18)',
      ringActive: 'rgba(74,96,112,0.35)',
      vertex: '#FFD23A',
      steel: '#223244',
    }

    let t0 = performance.now()
    const DURATION = 3200 // ms for full draw

    const draw = (now) => {
      const elapsed = now - t0
      ctx.clearRect(0, 0, W, H)

      // Vacuum gradient background
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7)
      grad.addColorStop(0, '#0c1620')
      grad.addColorStop(1, COLORS.vacuum)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // Detector rings
      const ringProgress = Math.min(1, elapsed / 1800)
      RINGS.forEach((r, i) => {
        const ringAlpha = 0.08 + (i / RINGS.length) * 0.08
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(74,96,112,${ringAlpha * ringProgress})`
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // Calorimeter wedge bars (background decoration)
      const wedgeProgress = Math.min(1, Math.max(0, (elapsed - 800) / 1400))
      if (wedgeProgress > 0) {
        const wedgeCount = 24
        for (let i = 0; i < wedgeCount; i++) {
          const a = (i / wedgeCount) * Math.PI * 2
          const innerR = 130
          const outerR = 155
          const wedgeAlpha = wedgeProgress * 0.25
          ctx.beginPath()
          ctx.arc(cx, cy, outerR, a, a + 0.18)
          ctx.arc(cx, cy, innerR, a + 0.18, a, true)
          ctx.closePath()
          const isRed = (i % 6) === 0
          ctx.fillStyle = isRed
            ? `rgba(255,77,77,${wedgeAlpha})`
            : `rgba(53,208,255,${wedgeAlpha * 0.6})`
          ctx.fill()
        }
      }

      // Curved particle tracks
      TRACKS.forEach((track, ti) => {
        const trackStart = track.delay
        const trackDuration = 900
        const p = Math.min(1, Math.max(0, (elapsed - trackStart) / trackDuration))
        if (p <= 0) return

        // Cubic bezier: start at vertex, end near ring edge
        const startAngle = (track.angle * Math.PI) / 180
        const ex = cx + Math.cos(startAngle) * track.radius * 0.85
        const ey = cy + Math.sin(startAngle) * track.radius * 0.85
        const cp1x = cx + Math.cos(startAngle + track.curvature) * track.radius * 0.4
        const cp1y = cy + Math.sin(startAngle + track.curvature) * track.radius * 0.4
        const cp2x = cx + Math.cos(startAngle - track.curvature * 0.5) * track.radius * 0.7
        const cp2y = cy + Math.sin(startAngle - track.curvature * 0.5) * track.radius * 0.7

        // Eased progress
        const ep = p * p * (3 - 2 * p) // smoothstep

        const drawP = Math.min(1, ep)

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        // Draw to eased point along bezier
        const t = drawP
        const mt = 1 - t
        const px = mt*mt*mt*cx + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*ex
        const py = mt*mt*mt*cy + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*ey
        ctx.quadraticCurveTo(cp1x, cp1y, px, py)

        ctx.strokeStyle = track.color
        ctx.lineWidth = track.width
        ctx.globalAlpha = 0.7 + p * 0.3
        ctx.stroke()
        ctx.globalAlpha = 1

        // Glow at tip
        if (p > 0.1 && p < 0.95) {
          ctx.beginPath()
          ctx.arc(px, py, 3, 0, Math.PI * 2)
          ctx.fillStyle = track.color
          ctx.globalAlpha = 0.6
          ctx.fill()
          ctx.globalAlpha = 1
        }
      })

      // Central vertex glow
      const vertexP = Math.min(1, elapsed / 600)
      if (vertexP > 0) {
        const vg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16 * vertexP)
        vg.addColorStop(0, 'rgba(255,210,60,0.6)')
        vg.addColorStop(0.5, 'rgba(255,210,60,0.1)')
        vg.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(cx, cy, 16 * vertexP, 0, Math.PI * 2)
        ctx.fillStyle = vg
        ctx.fill()

        ctx.beginPath()
        ctx.arc(cx, cy, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#FFD23A'
        ctx.fill()
      }

      // Sparks
      sparks.forEach((s) => {
        const sp = ((elapsed * s.speed * 0.001) % 1)
        const alpha = s.life * (1 - sp) * vertexP
        if (alpha <= 0) return
        const dx = cx + Math.cos(s.angle) * s.dist * sp
        const dy = cy + Math.sin(s.angle) * s.dist * sp
        ctx.beginPath()
        ctx.arc(dx, dy, 1.2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,210,60,${alpha})`
        ctx.fill()
      })

      if (elapsed < DURATION + 500) {
        animRef.current = requestAnimationFrame(draw)
      }
    }

    const handleIntersect = (entries) => {
      if (entries[0].isIntersecting && !visible) {
        setVisible(true)
        t0 = performance.now()
        animRef.current = requestAnimationFrame(draw)
      }
    }

    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.3 })
    observer.observe(canvas.parentElement)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      observer.disconnect()
    }
  }, [visible])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      aria-hidden="true"
    />
  )
}

/* ─── Nav ─────────────────────────────────────────────────────────────────── */

export function SessionNav() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10)
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'bg-[#0d1520]/90 backdrop-blur-md border-b border-[#4a6070]/20' : 'bg-transparent'
      }`}
    >
      {/* Progress track */}
      <div className="absolute inset-x-0 top-0 h-[2px]" aria-hidden="true">
        <div
          className="h-full bg-[#FFD23A] transition-all duration-150"
          style={{ transform: `scaleX(${progress})`, transformOrigin: 'left' }}
        />
      </div>

      <div className="mx-auto flex h-[56px] max-w-[1440px] items-center justify-between px-5 sm:px-8">
        <a
          href="#top"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          className="shrink-0 transition-opacity hover:opacity-75"
          aria-label="KeyzAI, back to top"
        >
          <Wordmark className="text-[14px] text-[#f5f5f4]" />
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Page sections">
          {[
            { href: '#channels', label: 'Channels' },
            { href: '#prd-run', label: 'PRD Run' },
            { href: '#sources', label: 'Models' },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#94a3b8] transition-colors hover:text-[#f5f5f4]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => navigate('/chat')}
          className="group inline-flex h-8 shrink-0 items-center gap-2 border border-[#4a6070]/40 bg-[#f5f5f4]/95 px-3.5 font-mono text-[11px] font-semibold text-[#080F14] transition-transform hover:-translate-y-0.5 hover:bg-white"
        >
          <span className="hidden sm:inline">{user ? 'Open chat' : 'Sign in'}</span>
          <span className="sm:hidden">{user ? 'Chat' : 'Sign in'}</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */

function HeroSection({ navigate }) {
  return (
    <section
      id="top"
      className="relative scroll-mt-[56px] min-h-dvh overflow-hidden bg-[#080F14] text-[#f5f5f4]"
    >
      {/* Event canvas */}
      <EventCanvas />

      {/* Gradient overlay at bottom for content readability */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#080F14]/0 via-[#080F14]/0 to-[#080F14]"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-[1440px] flex-col justify-center px-5 py-28 sm:px-8 sm:py-32 lg:flex-row lg:px-12 lg:pb-32 lg:pt-32">
        {/* Left: event label */}
        <div className="mb-10 flex-1 lg:mb-0 lg:mr-12 xl:mr-16">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#94a3b8]">
              <span className="size-1.5 rounded-full bg-[#FFD23A] animate-pulse" aria-hidden="true" />
              live event
            </span>
            <span className="font-mono text-[10px] text-[#94a3b8]/60">vertex · 3 tracks</span>
          </div>
          <h1 className="font-heading text-[3.5rem] font-medium leading-[1.02] tracking-[-0.04em] text-[#f5f5f4] sm:text-[4.5rem] lg:text-[5rem] xl:text-[5.5rem]">
            Every model.{' '}
            <span className="text-[#FFD23A]">One tree.</span>
          </h1>
          <p className="mt-6 max-w-[52ch] text-[16px] leading-[1.7] text-[#94a3b8] sm:text-[17px]">
            Chat, code and PRDs in one workspace. Edit any message and regenerate forward — the
            conversation branches instead of breaking, and every branch stays on every device.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="group inline-flex h-12 items-center gap-2.5 bg-[#f5f5f4] px-6 font-mono text-[13px] font-semibold text-[#080F14] transition-transform hover:-translate-y-0.5"
            >
              Open chat
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
            <a
              href="#prd-run"
              className="inline-flex h-12 items-center border border-[#4a6070]/40 px-5 font-mono text-[12px] font-medium text-[#94a3b8] transition-colors hover:border-[#4a6070]/70 hover:text-[#f5f5f4]"
            >
              From idea to PRD
            </a>
          </div>

          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#94a3b8]/60">
            Free · Google sign-in · no card
          </p>
        </div>

        {/* Right: telemetry strip */}
        <div className="flex-1 lg:max-w-[320px]">
          <div className="rounded-sm border border-[#4a6070]/25 bg-[#0d1520]/80 backdrop-blur-sm p-5">
            <div className="mb-4 flex items-center justify-between border-b border-[#4a6070]/20 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#94a3b8]">Telemetry</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#94a3b8]/60">
                <span className="size-1.5 rounded-full bg-[#FFD23A] animate-pulse" aria-hidden="true" />
                active
              </span>
            </div>
            <dl className="space-y-3 font-mono text-[11px]">
              {[
                { label: 'first token', value: '1.4s', accent: false },
                { label: 'branches', value: '3', accent: true },
                { label: 'sync', value: 'D1 ✓', accent: false },
                { label: 'models', value: '3 live', accent: false },
              ].map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-[#94a3b8]/70">{item.label}</dt>
                  <dd className={item.accent ? 'text-[#FFD23A]' : 'text-[#f5f5f4]'}>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Track legend */}
          <div className="mt-4 rounded-sm border border-[#4a6070]/20 bg-[#0d1520]/60 p-4">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#94a3b8]/50">Track legend</div>
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center gap-2.5">
                <span className="size-3 rounded-sm bg-[#FFD23A]/80" aria-hidden="true" />
                <span className="text-[#94a3b8]">Main thread</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="size-3 rounded-sm bg-[#35D0FF]/80" aria-hidden="true" />
                <span className="text-[#94a3b8]">Branch</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="size-3 rounded-sm bg-[#FF4D4D]/60" aria-hidden="true" />
                <span className="text-[#94a3b8]">Calorimeter</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#94a3b8]/40">
        <span className="animate-bounce block">↓</span>
      </div>
    </section>
  )
}

/* ─── Channels (Calorimeter Bars) ─────────────────────────────────────────── */

const CHANNELS = [
  {
    key: 'chat',
    level: 8.2,
    title: 'Streamed conversation',
    body: 'Responses arrive as they are written. Stop mid-answer when you have read enough — the partial text is what gets saved.',
  },
  {
    key: 'code',
    level: 6.4,
    title: 'Code and debugging',
    body: 'Paste the stack trace, describe the bug, get the fix. Argue with it in the next branch when it is wrong.',
  },
  {
    key: 'write',
    level: 7.1,
    title: 'Drafting',
    body: 'Emails, specs, documentation. Adjust tone and length without discarding the version that was nearly right.',
  },
  {
    key: 'think',
    level: 9.0,
    title: 'Deep reasoning',
    body: 'Route a hard question to DeepSeek V4 Flash mid-thread and keep both answers side by side in the tree.',
  },
  {
    key: 'sync',
    level: null,
    title: 'Cross-device sync',
    body: 'Sign in with Google. Every branch lands in your account, so the conversation on your phone is the one you left.',
  },
]

function ChannelsBlock() {
  return (
    <section
      id="channels"
      className="scroll-mt-[56px] border-t border-[#4a6070]/15 bg-[#080F14] py-20 sm:py-24 lg:py-28"
      aria-labelledby="channels-title"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-12">
        <div className="mb-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,44ch)] lg:items-end">
          <div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#94a3b8]">
              # channels
            </span>
            <h2
              id="channels-title"
              className="mt-4 font-heading text-[2rem] font-medium leading-[1.08] tracking-[-0.03em] text-[#f5f5f4] sm:text-[2.5rem]"
            >
              Five channels, one tree
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-[#94a3b8]">
            The same workspace serves each kind of work, and every one of them branches the same way.
            Pick the channel; the conversation still belongs to you.
          </p>
        </div>

        <div className="overflow-hidden rounded-sm border border-[#4a6070]/20 bg-[#0d1520]/50">
          {CHANNELS.map((c, i) => (
            <div
              key={c.key}
              className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-2 px-5 py-5 sm:grid-cols-[100px_100px_1fr] sm:gap-x-8 sm:py-6"
            >
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#94a3b8]">
                {c.key}
              </span>

              {/* Calorimeter bar */}
              <div className="flex items-center gap-2.5">
                {c.level == null ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#FFD23A]">
                    always on
                  </span>
                ) : (
                  <>
                    <div className="h-[3px] w-16 rounded-sm bg-[#4a6070]/25 sm:w-20">
                      <div
                        className="h-full rounded-sm bg-[#94a3b8]"
                        style={{ width: `${(c.level / 10) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] tabular-nums text-[#f5f5f4]/80">
                      {c.level.toFixed(1)}
                    </span>
                  </>
                )}
              </div>

              <div>
                <h3 className="text-[16px] font-medium text-[#f5f5f4]">{c.title}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-[#94a3b8]">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── PRD Run (Calibration Sequence) ─────────────────────────────────────── */

const PRD_STEPS = [
  { key: 'ideation',    label: 'Ideation',    out: 'concept captured'    },
  { key: 'clarify',     label: 'Clarify',     out: 'gaps resolved'       },
  { key: 'stack',       label: 'Tech stack',  out: 'recommendations issued' },
  { key: 'structure',   label: 'Structure',   out: 'feature map built'   },
  { key: 'prd',         label: 'PRD',         out: 'document ready'      },
]

const PRD_SECTIONS = [
  ['1', 'Summary',           '142'],
  ['2', 'Goals & non-goals', '96'],
  ['3', 'User stories',      '218'],
  ['4', 'Tech stack',        '74'],
  ['5', 'Architecture',      '184'],
  ['6', 'Milestones',        '88'],
  ['7', 'Risks',             '62'],
]

function PrdRunBlock({ navigate }) {
  return (
    <section
      id="prd-run"
      className="scroll-mt-[56px] border-t border-[#4a6070]/15 bg-[#080F14] py-20 sm:py-24 lg:py-28"
      aria-labelledby="prd-title"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-12">
        <div className="mb-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,44ch)] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#94a3b8]">
                # prd.run
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#FFD23A]">
                <span className="size-1.5 rounded-full bg-[#FFD23A]" aria-hidden="true" />
                Beta
              </span>
            </div>
            <h2
              id="prd-title"
              className="mt-4 font-heading text-[2rem] font-medium leading-[1.08] tracking-[-0.03em] text-[#f5f5f4] sm:text-[2.5rem]"
            >
              An idea, run to a document
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-[#94a3b8]">
            A second mode of the same workspace. Same tree, same sync — it just keeps asking you
            questions until the thing is specified.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-16">
          {/* Steps as calibration sequence */}
          <ol className="space-y-0">
            {PRD_STEPS.map((s, i) => (
              <li
                key={s.key}
                className="group flex items-baseline gap-4 border-b border-[#4a6070]/15 py-5 first:border-t sm:gap-6"
              >
                <span className="font-mono text-[10px] tabular-nums text-[#94a3b8]/50">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={`h-px w-8 transition-all duration-300 group-hover:w-14 ${
                    i === PRD_STEPS.length - 1 ? 'bg-[#FFD23A]' : 'bg-[#4a6070]/40'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[15px] font-medium text-[#f5f5f4]">{s.label}</span>
                <span className="ml-auto font-mono text-[11px] text-[#94a3b8]/60">
                  {s.out}
                </span>
              </li>
            ))}
          </ol>

          {/* PRD document preview */}
          <div className="rounded-sm border border-[#4a6070]/25 bg-[#0d1520]/70 p-0">
            <div className="flex items-center justify-between border-b border-[#4a6070]/20 px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#94a3b8]">
                prd.md
              </span>
              <span className="font-mono text-[10px] tabular-nums text-[#94a3b8]/60">864 words</span>
            </div>
            <ul className="px-4 py-3">
              {PRD_SECTIONS.map(([n, name, words]) => (
                <li
                  key={n}
                  className="flex items-baseline gap-3 border-b border-[#4a6070]/10 py-2 last:border-b-0"
                >
                  <span className="font-mono text-[10px] tabular-nums text-[#FFD23A]/80">{n}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[#f5f5f4]/85">{name}</span>
                  <span className="font-mono text-[10px] tabular-nums text-[#94a3b8]/50">
                    {words}w
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-[#4a6070]/20 px-4 py-3.5">
              <button
                type="button"
                onClick={() => navigate('/prd-builder')}
                className="group inline-flex h-10 w-full items-center justify-center gap-2 bg-[#f5f5f4] font-mono text-[12px] font-semibold text-[#080F14] transition-transform hover:-translate-y-0.5"
              >
                Run it yourself
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Sources (Model List) ────────────────────────────────────────────────── */

function SourcesBlock() {
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(null), 1600)
    return () => clearTimeout(id)
  }, [copied])

  const copy = (id) => {
    navigator.clipboard?.writeText(id).then(() => setCopied(id), () => setCopied(null))
  }

  return (
    <section
      id="sources"
      className="scroll-mt-[56px] border-t border-[#4a6070]/15 bg-[#080F14] py-20 sm:py-24 lg:py-28"
      aria-labelledby="sources-title"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-12">
        <div className="mb-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,44ch)] lg:items-end">
          <div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#94a3b8]">
              # sources
            </span>
            <h2
              id="sources-title"
              className="mt-4 font-heading text-[2rem] font-medium leading-[1.08] tracking-[-0.03em] text-[#f5f5f4] sm:text-[2.5rem]"
            >
              Every model, zero cost
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-[#94a3b8]">
            Three sources are live and free. Switch between them at any point in a conversation —
            the tree keeps both answers.
          </p>
        </div>

        <div className="overflow-hidden rounded-sm border border-[#4a6070]/20 bg-[#0d1520]/50">
          {MODELS.map((m, i) => (
            <div
              key={m.id}
              className={`grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-2 px-5 py-5 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:gap-x-8 sm:py-6 ${
                i < MODELS.length - 1 ? 'border-b border-[#4a6070]/15' : ''
              }`}
            >
              {/* Accent bar on left edge */}
              <div className="absolute left-0 top-0 h-full w-[2px] bg-[#FFD23A]/60" aria-hidden="true" />

              <img src={m.logo} alt="" className="size-9 shrink-0 object-contain sm:size-10" />

              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-[16px] font-medium text-[#f5f5f4]">{m.label}</h3>
                  <span className="font-mono text-[11px] text-[#94a3b8]/60">{m.provider}</span>
                  {m.isNew && (
                    <span className="border border-[#FFD23A]/40 px-1.5 py-px font-mono text-[10px] uppercase tracking-[0.12em] text-[#FFD23A]">
                      New
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <code className="font-mono text-[11px] text-[#94a3b8]/70">{m.id}</code>
                  <span className="text-[14px] text-[#94a3b8]">{m.taglineEn}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#FFD23A]">
                  Free
                </span>
                <button
                  type="button"
                  onClick={() => copy(m.id)}
                  className="inline-flex h-8 items-center gap-1.5 border border-[#4a6070]/30 px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#94a3b8] transition-colors hover:border-[#4a6070]/60 hover:text-[#f5f5f4]"
                  aria-label={`Copy model ID ${m.id}`}
                >
                  {copied === m.id ? (
                    <>
                      <CheckIcon className="size-3 text-[#FFD23A]" strokeWidth={2.5} aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    'Copy id'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */

const CLOSE_LINKS = [
  { to: '/chat', label: 'Open chat' },
  { to: '/prd-builder', label: 'PRD Builder', chip: 'Beta' },
  { to: '/changelog', label: 'Changelog' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
]

function Footer() {
  const navigate = useNavigate()
  return (
    <footer className="border-t border-[#4a6070]/15 bg-[#080F14]">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
        {/* Event closed line */}
        <div className="mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-[#4a6070]/15 pb-6">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#94a3b8]">
            event recorded
          </span>
          <span className="font-mono text-[11px] text-[#94a3b8]/50">
            nothing charged · no card on file
          </span>
        </div>

        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-[38ch] text-[14px] leading-relaxed text-[#94a3b8]">
            KeyzAI — every major AI model, free. Chat, code and PRDs in one workspace.
          </p>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-4">
            {CLOSE_LINKS.map((l) => (
              <a
                key={l.to}
                href={l.to}
                onClick={(e) => { e.preventDefault(); navigate(l.to) }}
                className="inline-flex min-h-[36px] items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#94a3b8]/70 transition-colors hover:text-[#f5f5f4]"
              >
                {l.label}
                {l.chip && (
                  <span className="border border-[#FFD23A]/40 px-1 py-px text-[9px] text-[#FFD23A]">
                    {l.chip}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>

        <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.12em] text-[#94a3b8]/40">
          © 2026 KeyzAI · by{' '}
          <a
            href="https://github.com/keyzakyy-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[24px] items-center text-[#94a3b8]/70 transition-colors hover:text-[#FFD23A]"
          >
            Keyzakyy
          </a>
        </p>
      </div>
    </footer>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

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
            text: 'Yes. KeyzAI is free with no credit card required. Sign in with Google and start chatting with any available model.',
          },
        },
        {
          '@type': 'Question',
          name: 'What AI models are available on KeyzAI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'KeyzAI provides access to multiple AI models including Qwen 3.8 Flash and DeepSeek V4 Flash. You can switch between models at any point during a conversation.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are chat histories saved?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Chat history syncs automatically across all devices you use, protected by your Google login session.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the PRD Builder?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The PRD Builder turns rough product ideas into complete Product Requirements Documents. You describe the idea, the AI clarifies details, recommends technology, and structures the product.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does streaming work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'KeyzAI streams AI responses as they are generated, so you can read along and stop at any point instead of waiting for completion.',
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
    <div className="landing-shell min-h-dvh bg-[#080F14] text-[#f5f5f4] antialiased">
      <SessionNav />
      <main>
        <HeroSection navigate={navigate} />
        <ChannelsBlock />
        <PrdRunBlock navigate={navigate} />
        <SourcesBlock />
      </main>
      <Footer />
    </div>
  )
}
