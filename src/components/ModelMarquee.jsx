/**
 * Marquee model gratis untuk kolom kanan hero.
 *
 * Dua baris berlawanan arah, isi tiap baris dirender 2x supaya loop
 * translateX(-50%) menyambung tanpa celah. Tanpa state dan timer: gerak
 * sepenuhnya CSS, jadi tidak ada yang perlu di-cleanup saat unmount.
 */

import { MODELS } from '../lib/models'

// Screen reader harus dapat ketiga model, bukan enam: baris kedua memang
// cuma supaya loop-nya nyambung, isinya identik.
const LABEL = MODELS.map((m) => m.label).join(', ')

function Tile({ model }) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <img
        src={model.logo}
        alt=""
        loading="lazy"
        className="size-7 shrink-0 rounded-md object-contain"
      />
      <div className="flex min-w-0 flex-col leading-none">
        <span className="truncate text-sm font-medium text-foreground">
          {model.label}
        </span>
        <span className="mt-1 truncate text-[11px] text-muted-foreground">
          {model.provider}
        </span>
      </div>
    </div>
  )
}

function Row({ reverse = false }) {
  return (
    <div
      className={`flex w-max py-3 hover:[animation-play-state:paused] ${
        reverse ? 'animate-marquee-reverse' : 'animate-marquee'
      }`}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          // Salinan kedua disembunyikan dari a11y tree — bukan "dipakai dua
          // kali", cuma mengisi ruang setelah sambungan loop.
          aria-hidden={copy === 1 ? 'true' : undefined}
          className="flex shrink-0 items-center gap-10 pr-10"
        >
          {MODELS.map((m) => (
            <Tile key={m.id} model={m} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ModelMarquee() {
  return (
    <div
      role="img"
      aria-label={`Tiga model AI gratis: ${LABEL}.`}
      className="select-none overflow-hidden"
      // Fade horizontal: logo menghilang halus di tepi, bukan terpotong rata.
      style={{
        maskImage:
          'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)',
      }}
    >
      <Row />
      <Row reverse />
    </div>
  )
}
