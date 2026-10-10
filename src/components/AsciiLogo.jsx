import { LOGO_LINES } from '../lib/asciiLogo'

// Lapis tumpang tindih dalam satu grid karakter (offset dalam baris/kolom
// karakter, bukan px) — efek layering dibuat dari karakter asli, bukan CSS.
// Urutan render = back ke front; offset besar = makin belakang.
//
// Hanya 3 lapis: muka + dua tepi diagonal. Semula 6, tapi 3 di antaranya
// berwarna #140d02 dengan kontras 1.03:1 terhadap latar gelap alias tidak
// terlihat, jadi effort dan node DOM-nya terbuang sia-sia.
//
// Warna tidak ada di sini — semuanya lewat kelas `ascii-*` yang diatur di
// index.css, supaya ikut tema terang/gelap.
const LAYERS = [
  { dr: 2, dc: 2, tone: 'deep' },
  { dr: 1, dc: 1, tone: 'mid' },
  { dr: 0, dc: 0, tone: 'face' },
]

export function AsciiLogo({ lines = LOGO_LINES, className = '' }) {
  const rows = lines.map((l) => l.padEnd(Math.max(...lines.map((x) => x.length))))
  const shifted = (dr, dc) =>
    [
      ...Array.from({ length: dr }, () => ' '.repeat(rows[0].length)),
      ...rows.map((l) => ' '.repeat(dc) + l),
    ].join('\n')

  return (
    <div className={`ascii-logo relative mx-auto w-fit max-w-full select-none overflow-x-auto pb-1 ${className}`}>
      {LAYERS.map((layer, i) => (
        <pre
          key={`${layer.dr}-${layer.dc}`}
          aria-hidden={i !== LAYERS.length - 1}
          role={i === LAYERS.length - 1 ? 'img' : undefined}
          aria-label={i === LAYERS.length - 1 ? 'KeyzAI' : undefined}
          // font-code, bukan font-mono: logo ini dirakit dari tiga lapis grid
          // karakter yang digeser dengan spasi, jadi setiap glyph WAJIB punya
          // advance width sama. IBM Plex Sans (font-mono) proporsional —
          // memakainya di sini membuat ketiga lapis tidak sejajar.
          className={`ascii-${layer.tone} ${i === 0 ? 'relative' : 'absolute inset-x-0 top-0'} font-code text-left text-[10px] leading-[1] whitespace-pre sm:text-xs`}
        >
          {shifted(layer.dr, layer.dc)}
        </pre>
      ))}
    </div>
  )
}