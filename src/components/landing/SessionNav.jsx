import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Wordmark } from '../../lib/logo-img'
import { useAuth } from '../../hooks/useAuth'

/**
 * Session nav.
 *
 * A hairline bar, not a floating pill: the log's own header. The wordmark sits
 * left; three mono link labels point at the log blocks below; the linen button
 * is the one control on the page allowed to be the brightest object. The scroll
 * hairline at the very top is the session's read position — it is the only
 * chrome that moves.
 */
export function SessionNav() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const doc = document.documentElement
    const onScroll = () => {
      const max = doc.scrollHeight - doc.clientHeight
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const links = [
    { href: '#channels', label: 'Channels' },
    { href: '#prd-run', label: 'PRD run' },
    { href: '#sources', label: 'Sources' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-foreground/15 bg-background/95 backdrop-blur-md">
      {/* Read position: a 2px hairline that fills as the session is read. */}
      <div className="absolute inset-x-0 top-0 h-[2px]" aria-hidden="true">
        <div
          className="h-full origin-left bg-yellow-400"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <div className="mx-auto flex h-[60px] max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="shrink-0 transition-opacity hover:opacity-75"
          aria-label="KeyzAI, back to the top of the session"
        >
          <Wordmark className="text-[15px]" />
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Session blocks">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="inline-flex min-h-[36px] items-center font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => navigate('/chat')}
          className="group inline-flex h-9 shrink-0 items-center gap-2 bg-foreground px-4 font-mono text-[12px] font-semibold text-background transition-transform hover:-translate-y-0.5"
        >
          <span className="hidden sm:inline">{user ? 'Open chat' : 'Sign in'}</span>
          <span className="sm:hidden">{user ? 'Chat' : 'Sign in'}</span>
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  )
}
