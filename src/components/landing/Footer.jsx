import { Link } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { LogoImg } from '../../lib/logo-img'

export function GithubMark({ className, ...props }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

// Footer bersama: dipakai landing, halaman legal, dan changelog.
export function Footer() {
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
