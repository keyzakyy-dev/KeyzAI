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

// Durasi wipe dibaca dari CSS (--wipe-cover-ms / --wipe-reveal-ms di :root),
// bukan ditulis ulang di sini. Animasi CSS dan timer swap kelas .dark
// mengambil sumber yang sama, jadi tidak bisa terpisah.
const FALLBACK = { cover: 620, reveal: 720 }

function readDurations() {
  const styles = getComputedStyle(document.documentElement)
  const read = (name, fallback) => {
    const raw = styles.getPropertyValue(name)
    if (!raw) return fallback
    const n = parseFloat(raw)
    if (!Number.isFinite(n)) return fallback
    // Minifier CSS menulis 620ms sebagai ".62s" — parseFloat("0.62s")
    // hanya menghasilkan 0.62, jadi satuan 's' harus dikonversi.
    return raw.trim().endsWith('ms') ? n : n * 1000
  }
  return {
    cover: read('--wipe-cover-ms', FALLBACK.cover),
    reveal: read('--wipe-reveal-ms', FALLBACK.reveal),
  }
}

let overlay = null
let timers = []

function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

function later(fn, ms) {
  timers.push(setTimeout(fn, ms))
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

function origin() {
  const el = document.activeElement
  if (el && el !== document.body && el.getBoundingClientRect) {
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
 */
export function playThemeWipe(target, onSwap) {
  clearTimers()
  destroyOverlay()

  // Tanpa dukungan animasi, langsung swap saja.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onSwap()
    return
  }

  const el = createOverlay()
  const { x, y } = origin()

  const { cover, reveal } = readDurations()

  el.style.setProperty('--wipe-bg', resolveTargetBg(target))
  el.style.setProperty('--wipe-x', `${x}px`)
  el.style.setProperty('--wipe-y', `${y}px`)
  el.dataset.state = 'cover'

  // Tukar kelas .dark saat layar tertutup penuh, lalu buka lagi.
  // Buffer 30ms menahan antara 'layar penuh' dan '--wipe-cover-ms'.
  later(() => {
    onSwap()
    el.dataset.state = 'reveal'
  }, cover + 30)

  later(() => {
    el.dataset.state = ''
    destroyOverlay()
  }, cover + reveal + 60)
}
