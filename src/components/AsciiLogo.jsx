import { LOGO_LINES } from '../lib/asciiLogo'

// Lapis tumpang tindih dalam satu grid karakter (offset dalam baris/kolom
// karakter, bukan px) — efek layering dibuat dari karakter asli, bukan CSS.
// Urutan render = back ke front; offset besar = makin belakang.
const LAYERS = [
  { dr: 2, dc: 1, color: '#3d0a00' },
  { dr: 1, dc: 1, color: '#140d02' },
  { dr: 1, dc: 0, color: '#140d02' },
  { dr: 0, dc: 1, color: '#140d02' },
  { dr: 2, dc: 0, color: '#8a1a00' },
  { dr: 0, dc: 0, color: '#ff0000' },
]

export function AsciiLogo({ lines = LOGO_LINES, className = '' }) {
  const rows = lines.map((l) => l.padEnd(Math.max(...lines.map((x) => x.length))))
  const shifted = (dr, dc) =>
    [
      ...Array.from({ length: dr }, () => ' '.repeat(rows[0].length)),
      ...rows.map((l) => ' '.repeat(dc) + l),
    ].join('\n')

  return (
    <div className={`ascii-logo relative mx-auto w-fit max-w-full overflow-x-auto pb-1 ${className}`}>
      {LAYERS.map((layer, i) => (
        <pre
          key={`${layer.dr}-${layer.dc}`}
          aria-hidden={i !== LAYERS.length - 1}
          role={i === LAYERS.length - 1 ? 'img' : undefined}
          aria-label={i === LAYERS.length - 1 ? 'KeyzAI' : undefined}
          className={`${i === 0 ? 'relative' : 'absolute inset-x-0 top-0'} font-mono text-left text-[10px] leading-[1] whitespace-pre sm:text-xs`}
          style={{ color: layer.color }}
        >
          {shifted(layer.dr, layer.dc)}
        </pre>
      ))}
    </div>
  )
}
