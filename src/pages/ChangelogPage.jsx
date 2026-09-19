import { Link } from 'react-router-dom'
import { usePageMeta } from '../lib/seo'
import { ArrowRight } from 'lucide-react'

import { LogoImg } from '../lib/logo-img'
import { CHANGELOG } from '../lib/changelog'

const TYPE_LABEL = { new: 'Baru', polish: 'Poles', fix: 'Perbaikan' }
const TYPE_CLASS = {
  new: 'text-emerald-600 dark:text-emerald-400',
  polish: 'text-sky-600 dark:text-sky-400',
  fix: 'text-amber-600 dark:text-amber-400',
}

export function ChangelogPage() {
  usePageMeta({
    title: 'Changelog',
    description: 'Riwayat pembaruan KeyzAI: fitur baru, perbaikan, dan penyegaran tampilan dari rilis ke rilis.',
    path: '/changelog',
  })
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Kembali ke beranda" className="rounded-xl transition-opacity hover:opacity-80">
            <LogoImg className="h-8 w-auto" />
          </Link>
          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Kembali ke chat
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">Changelog</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Riwayat pembaruan KeyzAI — fitur baru, perbaikan, dan penyegaran tampilan.
        </p>

        <div className="relative mt-12 space-y-12">
          <span aria-hidden="true" className="absolute top-2 bottom-2 left-[7px] w-px bg-border" />
          {CHANGELOG.map((rel) => (
            <section key={rel.version} className="relative pl-8">
              <span
                aria-hidden="true"
                className="absolute top-1.5 left-0 h-[15px] w-[15px] rounded-full border-2 border-primary bg-background"
              />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-mono text-xl font-semibold tracking-tight text-foreground">{rel.version}</h2>
                <p className="text-xs text-muted-foreground">{rel.date}</p>
              </div>
              <p className="mt-0.5 text-sm font-medium text-foreground/90">{rel.tagline}</p>
              <ul className="mt-3 space-y-2">
                {rel.items.map((it, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                    <span
                      className={`mt-px shrink-0 text-[11px] font-semibold ${TYPE_CLASS[it.type]}`}
                    >
                      {TYPE_LABEL[it.type]}
                    </span>
                    <span>{it.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
