// Overlay wipe untuk perpindahan tema dark/light.
//
// Kenapa tidak View Transitions API: snapshot-based, hasilnya sulit
// diprediksi (halaman bisa ter-clip atau membeku). Overlay biasa
// lebih deterministik dan jalan di semua browser.
//
// Cara kerja: overlay warna solid tema tujuan diperbesar melingkar
// dari posisi tombol, kelas .dark ditukar saat layar tertutup penuh,
// lalu overlay dikecilkan kembali. Karena yang bergerak cuma clip-path
// pada satu elemen, tidak ada yang mem-trigger reflow halaman.
//
// Fase (cover -> swap -> reveal) dipicu event `animationend`, BUKAN
// setTimeout. Dulu durasi cover/reveal ditulis ulang di JS dan di CSS
// sebagai dua konstanta terpisah; kalau selisih sedikit saja, swap
// terjadi sebelum layar benar-benar tertutup dan tema lama kelihatan
// berkedip 1 frame di tepi. Sekarang tidak ada angka durasi yang bisa
// meleset — CSS yang menentukan, JS hanya mendengarkan.

const COVER_ANIM = 'theme-wipe-cover'
const REVEAL_ANIM = 'theme-wipe-reveal'

// Jaring pengaman kalau animationend tidak pernah datang (tab tidak
// aktif, elemen di-display:none, atau engine yang perilakunya aneh).
// Hanya dipakai di jalur abnormal; jalur normal menunggu event.
const FALLBACK_MS = { cover: 340, reveal: 430 }

let overlay = null
let pendingSwap = null
let phaseTimer = null

function clearPhaseTimer() {
  if (phaseTimer !== null) clearTimeout(phaseTimer)
  phaseTimer = null
}

// Swap yang masih tertunda tetap harus dieksekusi walau wipe berikutnya
// dimulai lebih dulu. Tanpa ini, toggle cepat di tengah animasi
// membatalkan timer swap lama: kelas .dark nyangkut di tengah dan
// animasi berjalan penuh tanpa ada perubahan tema yang terlihat.
function flushPendingSwap() {
  const fn = pendingSwap
  pendingSwap = null
  if (fn) fn()
}

// Warna background tema tujuan, dibaca dari :root / .dark yang aktif.
// Dipanggil SEBELUM kelas .dark ditukar, makanya ada mode 'light'.
function resolveTargetBg(target) {
  const root = document.documentElement
  const wasDark = root.classList.contains('dark')
  if (target === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  const bg = getComputedStyle(root).getPropertyValue('--background').trim()
  if (wasDark) root.classList.add('dark')
  else root.classList.remove('dark')
  return bg
}

// Titik pusat wipe: elemen pemicu dulu (diberikan lewat event click),
// lalu activeElement, lalu tengah viewport.
//
// activeElement saja tidak cukup: Safari tidak memfokuskan <button> saat
// diklik, jadi di browser itu wipe selalu keluar dari tengah layar
// walau di desktop yang lain keluar dari tombol.
function origin(trigger) {
  for (const el of [trigger, document.activeElement]) {
    if (!el || el === document.body || typeof el.getBoundingClientRect !== 'function') continue
    const r = el.getBoundingClientRect()
    if (r.width || r.height) {
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
}

function createOverlay() {
  const el = document.createElement('div')
  el.className = 'theme-wipe'
  el.setAttribute('aria-hidden', 'true')
  document.body.appendChild(el)
  overlay = el
  return el
}

function destroyOverlay() {
  if (overlay?.isConnected) overlay.remove()
  overlay = null
}

/**
 * Jalankan animasi wipe lalu panggil onSwap di saat layar tertutup penuh.
 * onSwap harus mengganti kelas .dark (satu-satunya efek samping yang terlihat).
 *
 * @param {'light'|'dark'} target tema tujuan
 * @param {() => void} onSwap satu-satunya efek samping, saat layar tertutup
 * @param {Element|null} [trigger] elemen pemicu, jadi wipe mulai dari tombol
 */
export function playThemeWipe(target, onSwap, trigger) {
  flushPendingSwap()
  clearPhaseTimer()
  destroyOverlay()

  // Tanpa dukungan animasi, langsung swap saja.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onSwap()
    return
  }

  const el = createOverlay()
  const { x, y } = origin(trigger)

  el.style.setProperty('--wipe-bg', resolveTargetBg(target))
  el.style.setProperty('--wipe-x', `${x}px`)
  el.style.setProperty('--wipe-y', `${y}px`)

  // Paksa style ter-compute sebelum animation dipasang. Elemen yang baru
  // di-insert dan langsung diberi animation kadang melompat ke frame
  // akhir tanpa interpolasi di beberapa engine.
  void el.offsetWidth

  let phase = 'cover'
  pendingSwap = onSwap

  const cleanup = () => {
    clearPhaseTimer()
    pendingSwap = null
    el.removeEventListener('animationend', onEnd)
    destroyOverlay()
  }

  const advance = () => {
    // Overlay sudah dibuang (toggle cepat) — jangan sentuh apa pun.
    if (overlay !== el) return
    if (phase === 'cover') {
      phase = 'reveal'
      flushPendingSwap()
      el.dataset.state = 'reveal'
      arm(FALLBACK_MS.reveal)
    } else {
      cleanup()
    }
  }

  const arm = (ms) => {
    clearPhaseTimer()
    phaseTimer = setTimeout(advance, ms)
  }

  function onEnd(e) {
    if (e.target !== el) return
    if (phase === 'cover' && e.animationName === COVER_ANIM) advance()
    else if (phase === 'reveal' && e.animationName === REVEAL_ANIM) advance()
  }

  el.addEventListener('animationend', onEnd)
  el.dataset.state = 'cover'
  arm(FALLBACK_MS.cover)
}
