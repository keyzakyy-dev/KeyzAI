import { MessageSquare, Code, Pencil, Lock, BookOpen, Sparkles, Zap, GitBranch } from 'lucide-react'
import { Reveal } from '../../lib/reveal'

const FEATURES = [
  {
    id: 'chat',
    title: 'Chat Bebas & Natural',
    desc: 'Tanyakan apa saja dalam Bahasa Indonesia yang mengalir natural tanpa batasan kaku.',
    icon: MessageSquare,
    badge: 'Real-time',
    span: 'col-span-1 md:col-span-2 lg:col-span-2',
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
        <div className="mb-12 text-center">
          <span className="inline-flex items-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Fitur Utama
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Tulis, kode, eksplorasi
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Dirancang untuk produktivitas tinggi dengan performa instan di edge network.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-3 lg:gap-5">
          {FEATURES.map((item, index) => {
            const Icon = item.icon
            return (
              <Reveal key={item.id} from="up" delay={index * 60} className={item.span}>
                <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card/60 p-6 transition-all duration-300 hover:border-foreground/30 hover:bg-card hover:shadow-md sm:p-8">
                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground/5 text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-6" />
                      </div>
                      <span className="rounded-full bg-background px-3 py-1 font-mono text-[11px] font-medium text-muted-foreground ring-1 ring-border">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-foreground sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-2 pt-4 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                    <span>Eksplorasi kemampuan</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
