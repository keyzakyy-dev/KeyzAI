// Overlay fade untuk perpindahan tema dark/light.
//
// Kenapa tidak View Transitions API: snapshot-based, hasilnya sulit
// diprediksi (halaman bisa ter-clip atau membeku). Overlay biasa
// lebih deterministik dan jalan di semua browser.
//
// Cara kerja: overlay warna solid tema tujuan memudar masuk sampai
// menutup layar, kelas .dark ditukar saat opacity sudah 1, lalu overlay
// memudar keluar. Karena yang bergerak cuma opacity pada satu elemen,
// tidak ada yang mem-trigger reflow halaman.
//
// Berbeda dengan wipe, fade tidak butuh titik asal maupun geometri: di
// titik tengah animasi layar sudah tertutup penuh dari mana pun kita
// mulai, jadi tidak ada yang perlu diukur.
//
// Fase (fadeIn -> swap -> fadeOut) dipicu event `animationend`, BUKAN
// setTimeout. Dulu durasi ditulis ulang di JS dan di CSS sebagai dua
// konstanta terpisah; kalau selisih sedikit saja, swap terjadi sebelum
// overlay benar-benar opaque dan tema lama kelihatan berkedip 1 frame.
// Sekarang tidak ada angka durasi yang bisa meleset — CSS yang menentukan,
// JS hanya mendengarkan.

const IN_ANIM = 'theme-fade-in'
const OUT_ANIM = 'theme-fade-out'

// Jaring pengaman kalau animationend tidak pernah datang (tab tidak
// aktif, elemen di-display:none, atau engine yang perilakunya aneh).
// Hanya dipakai di jalur abnormal; jalur normal menunggu event.
//
// Nilainya disamakan dengan durasi di src/index.css. Angka meleset di sini
// hanya bikin swap terjadi sedikit sebelum/after overlay opaque, jadi paling
// parah tema lama kelihatan berkedip 1 frame — bukan bug fatal. Tetap saja,
// jangan sampai meleset jauh.
const FALLBACK_MS = { fadeIn: 180, fadeOut: 220 }

let overlay = null
let pendingSwap = null
let phaseTimer = null

function clearPhaseTimer() {
  if (phaseTimer !== null) clearTimeout(phaseTimer)
  phaseTimer = null
}

// Swap yang masih tertunda tetap harus dieksekusi walau fade berikutnya
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

function createOverlay() {
  const el = document.createElement('div')
  el.className = 'theme-fade'
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
 * Jalankan animasi fade lalu panggil onSwap di saat overlay opaque penuh.
 * onSwap harus mengganti kelas .dark (satu-satunya efek samping yang terlihat).
 *
 * @param {'light'|'dark'} target tema tujuan
 * @param {() => void} onSwap satu-satunya efek samping, saat overlay opaque
 */
export function playThemeFade(target, onSwap) {
  flushPendingSwap()
  clearPhaseTimer()
  destroyOverlay()

  // Tanpa dukungan animasi, langsung swap saja.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onSwap()
    return
  }

  const el = createOverlay()

  el.style.setProperty('--fade-bg', resolveTargetBg(target))

  // Paksa style ter-compute sebelum animation dipasang. Elemen yang baru
  // di-insert dan langsung diberi animation kadang melompat ke frame
  // akhir tanpa interpolasi di beberapa engine.
  void el.offsetWidth

  let phase = 'in'
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
    if (phase === 'in') {
      phase = 'out'
      flushPendingSwap()
      el.dataset.state = 'out'
      arm(FALLBACK_MS.fadeOut)
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
    if (phase === 'in' && e.animationName === IN_ANIM) advance()
    else if (phase === 'out' && e.animationName === OUT_ANIM) advance()
  }

  el.addEventListener('animationend', onEnd)
  el.dataset.state = 'in'
  arm(FALLBACK_MS.fadeIn)
}