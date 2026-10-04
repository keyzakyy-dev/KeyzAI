import { useState, useEffect } from 'react'
import { Database } from 'lucide-react'
import { LogoImg } from '../../lib/logo-img'
import { MODELS } from '../../lib/models'

// Posisi dalam persen terhadap kotak aspect-square. Label ada di bawah node,
// jadi y Research geser sedikit supaya garis tampak meet the icon, bukan teks.
const NODES = [
  {
    id: 'engine',
    label: 'KeyzAI Engine',
    sub: 'Cloudflare Edge',
    isKeyzaiLogo: true,
    pos: { x: 50, y: 46 },
  },
  {
    id: 'qwen',
    label: 'Qwen 3.8 Flash',
    sub: 'Fast Reasoning',
    image: MODELS[0].logo,
    pos: { x: 86, y: 20 },
  },
  {
    id: 'deepseek',
    label: 'DeepSeek V4 Flash',
    sub: 'Complex Logic',
    image: MODELS[1].logo,
    pos: { x: 82, y: 80 },
  },
  {
    id: 'atria',
    label: 'Atria Dawn Preview',
    sub: 'Next-Gen Experiment',
    image: MODELS[2].logo,
    pos: { x: 18, y: 18 },
  },
  {
    id: 'sync',
    label: 'D1 State Sync',
    sub: 'Tree Branching',
    icon: Database,
    pos: { x: 12, y: 78 },
  },
]

export function ArchitectureGraph() {
  const [activeNode, setActiveNode] = useState('qwen')
  const [isHovering, setIsHovering] = useState(false)

  // Auto-cycle through nodes if not hovering
  useEffect(() => {
    if (isHovering) return
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % NODES.length
      if (NODES[i].id === 'engine') i = (i + 1) % NODES.length
      setActiveNode(NODES[i].id)
    }, 3000)
    return () => clearInterval(interval)
  }, [isHovering])

  const core = NODES.find((n) => n.id === 'engine')
  const satellites = NODES.filter((n) => n.id !== 'engine')

  /** Kurva tali (quadratic Bézier) dari core ke node.
      Sag proporsional jarak: 18% dari panjang garis lurus, tegak lurus.
      Control point di sisi kiri saat core.x > node.x, kanan saat core.x < node.x —
      supaya tali tidak saling tumpang-tindih di tengah. */
  function ropePath(node) {
    const x1 = core.pos.x
    const y1 = core.pos.y
    const x2 = node.pos.x
    const y2 = node.pos.y
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.hypot(dx, dy) || 1
    // Vektor tegak lurus (rotate 90°): (-dy, dx). Normalisasi.
    const nx = -dy / dist
    const ny = dx / dist
    // Sag = 18% jarak. Arah dipilih supaya tali cenderung "keluar" dari tengah.
    const sag = dist * 0.18
    const cx = (x1 + x2) / 2 + nx * sag
    const cy = (y1 + y2) / 2 + ny * sag
    return `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`
  }

  return (
    <div
      className="relative flex w-full max-w-[480px] flex-col items-center justify-center mx-auto"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative aspect-square w-full">
        {/* SVG Connections */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true">
          {satellites.map((node) => {
            const isActive = activeNode === node.id
            const isCore = activeNode === 'engine'
            const highlight = isActive || isCore
            const path = ropePath(node)

            return (
              <g key={`line-${node.id}`}>
                {/* Background track — rope curve */}
                <path
                  d={path}
                  className="stroke-border/60 transition-colors duration-500 fill-none"
                  strokeWidth="0.5"
                />

                {/* Active beam — solid rope curve */}
                <path
                  d={path}
                  className={`stroke-primary transition-opacity duration-500 fill-none ${
                    highlight ? 'opacity-100' : 'opacity-0'
                  }`}
                  strokeWidth="0.5"
                />
              </g>
            )
          })}
        </svg>

        {/* Nodes */}
        {NODES.map((node) => {
          const isActive = activeNode === node.id
          const isCore = node.id === 'engine'
          const Icon = node.icon

          return (
            <button
              key={node.id}
              type="button"
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 transition-all duration-300 z-10 ${
                isActive ? 'scale-110' : 'scale-100 opacity-80 hover:opacity-100'
              }`}
              style={{ left: `${node.pos.x}%`, top: `${node.pos.y}%` }}
              onClick={() => setActiveNode(node.id)}
              onMouseEnter={() => setActiveNode(node.id)}
              aria-label={node.label}
            >
              {/* Wrapper relatif khusus kotak ikon, bukan button-nya: button
                  juga berisi label teks di bawah, jadi denyut scale di button
                  akan ikut membesarakan teksnya. */}
              <span className="relative flex shrink-0 items-center justify-center">
                {/* Kotak model yang ditunjuk garis berdenyut (membesar-mengecil).
                    Animasi ada di kotak ikon; scale-110 di button tetap jalan
                    sebagai penekanan statis, bukan pengganti denyut. Node core
                    punya denyut sendiri (animate-ping di bawah) jadi dikecualikan
                    agar tidak berdenyut dua kali. */}
                <div
                  className={`relative flex items-center justify-center rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isCore
                      ? 'h-16 w-16 border-foreground/30 bg-card p-2 shadow-lg'
                      : 'h-12 w-12 border-border bg-background p-2'
                  } ${isActive ? 'border-primary ring-2 ring-primary/20 shadow-md' : ''} ${
                    isActive && !isCore ? 'node-breathe' : ''
                  }`}
                >
                {node.isKeyzaiLogo ? (
                    <LogoImg className="h-8 w-auto object-contain" />
                  ) : node.image ? (
                    <img
                      src={node.image}
                      alt={node.label}
                      className="h-full w-full object-contain"
                    />
                  ) : Icon ? (
                    <Icon
                      className={`transition-colors duration-300 h-5 w-5 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                  ) : null}

                  {/* Core pulse effect */}
                  {isCore && (
                    <div
                      className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-foreground/10 opacity-70"
                      style={{ animationDuration: '3s' }}
                    />
                  )}
                  {/* Active node glow */}
                  {isActive && !isCore && (
                    <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/20 blur-md" />
                  )}
                </div>
              </span>

              <div
                className={`text-center transition-opacity duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-0 sm:opacity-100'
                }`}
              >
                <p
                  className={`text-[11px] font-bold ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {node.label}
                </p>
                <p className="text-[9px] text-muted-foreground hidden sm:block">{node.sub}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
