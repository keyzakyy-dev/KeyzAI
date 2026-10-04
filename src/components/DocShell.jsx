import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Wordmark } from '../lib/logo-img'
import { Footer } from './landing/Footer'

// Layout bersama halaman dokumen (kebijakan privasi, syarat & ketentuan,
// changelog): header + section header (eyebrow + judul + deskripsi) +
// footer bersama — kosakata desain sama dengan landing page.
export function DocShell({ eyebrow, title, description, meta, children }) {
  return (
    <div className="min-h-dvh bg-background text-foreground antialiased">
      <header className="border-b border-foreground/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Kembali ke beranda" className="rounded-xl transition-opacity hover:opacity-80">
            <Wordmark />
          </Link>
          <Link
            to="/chat"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/15 bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/[0.04]"
          >
            Kembali ke chat
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-10 border-b border-foreground/10 pb-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-red-500" aria-hidden="true" />
            {eyebrow}
          </span>
          <h1 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
          {meta ? <p className="mt-3 text-xs text-muted-foreground/70">{meta}</p> : null}
        </div>
        {children}
      </main>

      <Footer />
    </div>
  )
}
