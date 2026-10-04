import { useState, useEffect, useRef } from 'react'
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
    label: 'Qwen 3',
      sub: '',
    image: MODELS[0].logo,
    pos: { x: 86, y: 20 },
  },
  {
    id: 'deepseek',
    label: 'DeepSeek V4',
      sub: '',
    image: MODELS[1].logo,
    pos: { x: 82, y: 80 },
  },
  {
    id: 'atria',
    label: 'Atria Dawn',
      sub: '',
    image: MODELS[2].logo,
    pos: { x: 18, y: 18 },
  },
  {
    id: 'sync',
    label: 'D1 State Sync',
      sub: '',
    icon: Database,
    pos: { x: 12, y: 78 },
  },
]

export function ArchitectureGraph() {
  const [activeNode, setActiveNode] = useState('qwen')
  const [isHovering, setIsHovering] = useState(false)
  const graphRef = useRef(null)
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    const element = graphRef.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasEntered(true)
        observer.disconnect()
      }
    }, { threshold: 0.25 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

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
    const ux = dx / dist
    const uy = dy / dist
    const startInset = 7
    const endInset = 5
    const startX = x1 + ux * startInset
    const startY = y1 + uy * startInset
    const endX = x2 - ux * endInset
    const endY = y2 - uy * endInset
    // Vektor tegak lurus (rotate 90°): (-dy, dx). Normalisasi.
    const nx = -dy / dist
    const ny = dx / dist
    // Sag = 18% jarak. Arah dipilih supaya tali cenderung "keluar" dari tengah.
    const sag = dist * 0.18
    const cx = (startX + endX) / 2 + nx * sag
    const cy = (startY + endY) / 2 + ny * sag
    return `M${startX} ${startY} Q${cx} ${cy} ${endX} ${endY}`
  }

  return (
    <div
      ref={graphRef}
      className={`relative mx-auto flex w-full max-w-[520px] flex-col items-center justify-center p-2 ${hasEntered ? 'architecture-entered' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative aspect-square w-full max-w-[440px]">
        {/* SVG Connections */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true">
          {satellites.map((node) => {
            const isActive = activeNode === node.id
            const isCore = activeNode === 'engine'
            const highlight = isActive || isCore
            const path = ropePath(node)

            return (
              <g key={`line-${node.id}`}>
                <path
                  d={path}
                  className="architecture-line-draw stroke-foreground/15 fill-none"
                  strokeWidth="0.35"
                  strokeDasharray="1 2"
                />
                <path
                  d={path}
                  className={`architecture-line-draw stroke-foreground/70 fill-none transition-opacity duration-500 ${
                    highlight ? 'opacity-100' : 'opacity-0'
                  }`}
                  strokeWidth="0.7"
                  strokeLinecap="round"
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
                isActive
                  ? 'scale-110'
                  : isCore
                  ? 'scale-100'
                  : 'scale-100 opacity-80 hover:opacity-100'
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
                  className={`relative flex items-center justify-center rounded-xl border transition-all duration-300 overflow-hidden ${
                    isCore
                      ? 'h-14 w-14 border-foreground/45 bg-transparent p-2'
                      : 'h-10 w-10 border-foreground/20 bg-transparent p-2'
                  } ${isActive ? 'border-foreground/70 ring-1 ring-foreground/20' : ''} ${
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
                  className={`text-[11px] font-medium ${
                    isActive ? 'text-foreground' : 'text-muted-foreground/70'
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
