import { usePageMeta } from '../lib/seo'
import { Reveal } from '../lib/reveal'
import { DocShell } from '../components/DocShell'
import { CHANGELOG } from '../lib/changelog'

const TYPE_LABEL = { new: 'Baru', polish: 'Poles', fix: 'Perbaikan' }
const TYPE_CLASS = {
  new: 'text-yellow-600 dark:text-yellow-400',
  polish: 'text-muted-foreground',
  fix: 'text-muted-foreground',
}

export function ChangelogPage() {
  usePageMeta({
    title: 'Changelog',
    description: 'Riwayat pembaruan KeyzAI: fitur baru, perbaikan, dan penyegaran tampilan dari rilis ke rilis.',
    path: '/changelog',
  })
  return (
    <DocShell
      eyebrow="Rilis"
      title="Changelog"
      description="Riwayat pembaruan KeyzAI — fitur baru, perbaikan, dan penyegaran tampilan dari rilis ke rilis."
    >
      <div className="relative">
        <span aria-hidden="true" className="absolute top-2 bottom-2 left-[7px] w-px bg-foreground/15" />
        {CHANGELOG.map((rel, i) => (
          <Reveal key={rel.version} from="up" delay={i * 50}>
            <div className="relative pb-8 pl-8 last:pb-0">
              <span
                aria-hidden="true"
                className="absolute top-[13px] left-0 h-[15px] w-[15px] rounded-full border-2 border-yellow-400 bg-background"
              />
              <div className="feature-grid">
                <div className="feature-card p-6 sm:p-7" style={{ '--card-line-delay': `${i * 90}ms` }}>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="font-mono text-lg font-semibold tracking-tight text-foreground">{rel.version}</h2>
                    <p className="text-xs text-muted-foreground">{rel.date}</p>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground/90">{rel.tagline}</p>
                  <ul className="mt-4 space-y-2">
                    {rel.items.map((it, j) => (
                      <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                        <span className={`mt-px shrink-0 text-[11px] font-semibold ${TYPE_CLASS[it.type]}`}>
                          {TYPE_LABEL[it.type]}
                        </span>
                        <span>{it.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </DocShell>
  )
}
