import { Link } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { Wordmark } from '../../lib/logo-img'

export function GithubMark({ className, ...props }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

const GROUPS = [
  {
    h: 'Produk',
    links: [
      { to: '/chat', label: 'Buka chat' },
      { to: '/prd-builder', label: 'PRD Builder', chip: 'Beta' },
      { to: '/changelog', label: 'Changelog' },
    ],
  },
  {
    h: 'Legal',
    links: [
      { to: '/privacy', label: 'Kebijakan Privasi' },
      { to: '/terms', label: 'Syarat & Ketentuan' },
    ],
  },
  {
    h: 'Lainnya',
    links: [
      { to: 'https://github.com/keyzakyy-dev', label: 'GitHub', external: true, icon: true },
    ],
  },
]

// Footer bersama: dipakai landing, halaman legal, dan changelog.
export function Footer() {
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer className="border-t border-foreground/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 py-12 sm:grid-cols-12 sm:py-14">
          {/* Brand */}
          <div className="sm:col-span-5">
            <Link to="/" aria-label="Kembali ke beranda" className="inline-flex rounded-lg transition-opacity hover:opacity-80">
              <Wordmark className="text-lg" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Akses semua AI favorit, gratis. Chat, kode, dan ubah ide jadi PRD — satu tempat.
            </p>
          </div>

          {/* Grup link */}
          <nav className="grid grid-cols-2 gap-8 sm:col-span-7 sm:grid-cols-3 sm:justify-self-end sm:pl-8">
            {GROUPS.map((g) => (
              <div key={g.h}>
                <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
                  {g.h}
                </h3>
                <ul className="mt-3 space-y-1">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      {l.external ? (
                        <a
                          href={l.to}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-8 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {l.icon && <GithubMark className="h-3.5 w-3.5" />}
                          {l.label}
                        </a>
                      ) : (
                        <Link
                          to={l.to}
                          className="inline-flex min-h-8 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {l.label}
                          {l.chip && (
                            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                              {l.chip}
                            </span>
                          )}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bar bawah */}
        <div className="flex flex-col-reverse gap-4 border-t border-foreground/10 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © 2026 KeyzAI · oleh{' '}
            <a
              href="https://github.com/keyzakyy-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              Keyzakyy
            </a>
          </p>
          <button
            type="button"
            onClick={toTop}
            className="inline-flex h-9 w-fit items-center gap-1.5 rounded-full border border-foreground/15 bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/[0.04]"
          >
            Ke atas
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  )
}
