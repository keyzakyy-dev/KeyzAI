import { MessageSquare, Code, Pencil, Lock, GitBranch } from 'lucide-react'
import { Reveal } from '../../lib/reveal'

const FEATURES = [
  {
    id: 'chat',
    title: 'Chat Bebas & Natural',
    desc: 'Tanyakan apa saja dalam Bahasa Indonesia yang mengalir natural tanpa batasan kaku.',
    icon: MessageSquare,
    badge: 'Real-time',
    span: 'col-span-2 md:col-span-2 lg:col-span-2',
  },
  {
    id: 'code',
    title: 'Analisis & Debug Kode',
    desc: 'Identifikasi bug, refactor syntax, dan bedah arsitektur kode dengan reasoning mendalam.',
    icon: Code,
    badge: 'Multi-language',
    span: 'col-span-1 md:col-span-1 lg:col-span-1',
  },
  {
    id: 'tree',
    title: 'Tree-Branching History',
    desc: 'Edit pesan lama atau regenerasi jawaban tanpa menghapus cabang percakapan sebelumnya.',
    icon: GitBranch,
    badge: 'Zero-Loss',
    span: 'col-span-1 md:col-span-1 lg:col-span-1',
  },
  {
    id: 'writing',
    title: 'Draf & Kreasi Konten',
    desc: 'Tulis email profesional, esai, atau dokumen teknis dengan penyesuaian gaya bahasa instan.',
    icon: Pencil,
    badge: 'Flexible',
    span: 'col-span-1 md:col-span-1 lg:col-span-1',
  },
  {
    id: 'privacy',
    title: 'Privat & Tanpa Pelacakan',
    desc: 'Data Anda tidak dijual dan tidak digunakan untuk melatih model publik.',
    icon: Lock,
    badge: 'Secure',
    span: 'col-span-1 md:col-span-1 lg:col-span-1',
  },
]

export function FeaturesBento() {
  return (
    <section id="features" className="relative scroll-mt-20 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-foreground/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Fitur utama
            </span>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Tulis, kode,{' '}
              <span className="text-yellow-600 dark:text-yellow-400">eksplorasi</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
            Satu ruang kerja untuk berpikir, membuat, dan menyelesaikan lebih cepat.
          </p>
        </div>

        <Reveal from="up" className="feature-grid-reveal">
          <div className="feature-grid relative grid grid-cols-2 md:grid-cols-3">
          {FEATURES.map((item, index) => {
            const Icon = item.icon
            return (
              <Reveal key={item.id} from="up" delay={index * 60} className={item.span} style={{ '--card-line-delay': `${index * 100}ms` }}>
                <div className="feature-card group relative flex h-full flex-col justify-between overflow-hidden p-4 sm:p-6 md:p-8">
                  <div>
                    <div className="mb-4 flex flex-col items-start gap-2.5 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex size-9 items-center justify-center text-foreground sm:size-10">
                        <Icon className="size-5 sm:size-6" />
                      </div>
                      <span className="bg-background px-2.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground sm:px-3 sm:py-1">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-medium text-foreground sm:text-lg md:text-xl">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:mt-3">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-5 hidden items-center gap-2 pt-3 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground sm:mt-6 sm:flex sm:pt-4">
                    <span>Eksplorasi kemampuan</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Reveal>
            )
          })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
