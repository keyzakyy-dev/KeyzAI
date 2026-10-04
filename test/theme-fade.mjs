/**
 * Logika overlay fade tema.
 *
 * Diuji dengan DOM minimal (bukan jsdom — tidak ada dependency baru):
 * theme-fade.js hanya butuh document.body, classList, style, dataset,
 * getComputedStyle, setTimeout, dan matchMedia. Semuanya di-stub di sini.
 *
 * Yang diuji: urutan fadeIn -> swap -> fadeOut, warna overlay sesuai target,
 * fallback reduced-motion, dan pembersihan overlay.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

// ---- DOM stub -------------------------------------------------------------

class StyleEl {
  constructor() {
    this.props = {}
    this.cssText = ''
  }
  setProperty(name, value) {
    this.props[name] = value
  }
  getPropertyValue(name) {
    return this.props[name] ?? ''
  }
  removeProperty(name) {
    delete this.props[name]
  }
}

class ClassList {
  constructor(el) {
    this.el = el
    this.set = new Set()
  }
  add(...names) {
    names.forEach((n) => this.set.add(n))
  }
  remove(...names) {
    names.forEach((n) => this.set.delete(n))
  }
  contains(name) {
    return this.set.has(name)
  }
  toggle(name, force) {
    const on = force ?? !this.set.has(name)
    if (on) this.set.add(name)
    else this.set.delete(name)
    return on
  }
}

class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase()
    this.children = []
    this.style = new StyleEl()
    this.dataset = {}
    this.classList = new ClassList(this)
    this.className = ''
    this.parentNode = null
    this.isConnected = false
    this._attrs = {}
    this._listeners = new Map()
    // theme-fade memaksa style ter-compute dengan membaca offsetWidth.
    this.offsetWidth = 0
  }
  setAttribute(k, v) {
    this._attrs[k] = v
  }
  getAttribute(k) {
    return this._attrs[k] ?? null
  }
  addEventListener(type, fn) {
    if (!this._listeners.has(type)) this._listeners.set(type, new Set())
    this._listeners.get(type).add(fn)
  }
  removeEventListener(type, fn) {
    this._listeners.get(type)?.delete(fn)
  }
  /** Simulasikan browser yang memancarkan animationend. */
  dispatch(type, detail = {}) {
    const e = { type, target: this, ...detail }
    for (const fn of this._listeners.get(type) ?? []) fn(e)
  }
  appendChild(child) {
    child.parentNode = this
    child.isConnected = this.isConnected
    this.children.push(child)
    return child
  }
  removeChild(child) {
    this.children = this.children.filter((c) => c !== child)
    child.parentNode = null
    child.isConnected = false
    return child
  }
  remove() {
    this.parentNode?.removeChild(this)
  }
  getBoundingClientRect() {
    return this._rect ?? { left: 0, top: 0, width: 0, height: 0 }
  }
}

const body = new El('body')
body.isConnected = true
const htmlEl = new El('html')
htmlEl.isConnected = true

// Warna background per tema, meniru nilai di src/index.css.
const THEME_BG = {
  light: '60 5% 94%',
  dark: '32 29% 4%',
}

globalThis.document = {
  body,
  documentElement: htmlEl,
  activeElement: null,
  createElement: (tag) => new El(tag),
}
globalThis.window = { innerWidth: 1200, innerHeight: 800, matchMedia: () => ({ matches: false }) }
globalThis.getComputedStyle = (el) => ({
  getPropertyValue: (name) => {
    if (name === '--background') {
      return THEME_BG[el.classList.contains('dark') ? 'dark' : 'light']
    }
    return ''
  },
})

// ---- Modul diuji ----------------------------------------------------------

const { playThemeFade } = await import('../src/lib/theme-fade.js')

// ---- Helper ---------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const overlay = () => body.children.find((c) => c.className === 'theme-fade')

function reset({ reducedMotion = false } = {}) {
  for (const c of [...body.children]) body.removeChild(c)
  htmlEl.classList.set = new Set(['dark'])
  document.activeElement = null
  globalThis.window.matchMedia = () => ({ matches: reducedMotion })
}

// ---- Test -----------------------------------------------------------------

test('overlay fade masuk, swap di tengah, lalu fade keluar', async () => {
  reset()
  const events = []

  playThemeFade('light', () => {
    events.push('swap')
    htmlEl.classList.toggle('dark', false)
  })

  // Fase fade-in: overlay ada, state=in, kelas .dark belum berubah.
  const el = overlay()
  assert.ok(el, 'overlay harus dibuat')
  assert.equal(el.dataset.state, 'in')
  assert.equal(el.getAttribute('aria-hidden'), 'true')
  assert.ok(htmlEl.classList.contains('dark'), 'kelas .dark belum boleh berubah saat fade masuk')
  assert.deepEqual(events, [])

  // Fade-in 180ms -> swap. Fade-out 220ms -> overlay dibuang.
  await sleep(300)

  assert.deepEqual(events, ['swap'], 'onSwap harus dipanggil sekali')
  assert.ok(!htmlEl.classList.contains('dark'), 'kelas .dark harus tertukar')
  assert.equal(el.dataset.state, 'out')

  await sleep(300)

  assert.equal(overlay(), undefined, 'overlay harus di-remove setelah animasi selesai')
})

test('fade ke dark memakai warna background dark', async () => {
  reset()
  htmlEl.classList.remove('dark')

  playThemeFade('dark', () => htmlEl.classList.add('dark'))

  assert.equal(overlay().style.getPropertyValue('--fade-bg'), THEME_BG.dark)
  await sleep(700)
  assert.ok(htmlEl.classList.contains('dark'))
})

test('fade ke light memakai warna background light', async () => {
  reset()

  playThemeFade('light', () => htmlEl.classList.remove('dark'))

  assert.equal(overlay().style.getPropertyValue('--fade-bg'), THEME_BG.light)
  await sleep(700)
})

test('resolveTargetBg tidak meninggalkan kelas .dark dalam keadaan salah', async () => {
  reset()
  htmlEl.classList.add('dark')

  playThemeFade('light', () => htmlEl.classList.remove('dark'))
  assert.equal(overlay().style.getPropertyValue('--fade-bg'), THEME_BG.light)
  await sleep(700)
  assert.ok(!htmlEl.classList.contains('dark'), 'harus berakhir di light')
})

test('prefers-reduced-motion: swap langsung, tanpa overlay', async () => {
  reset({ reducedMotion: true })
  let swapped = false

  playThemeFade('light', () => {
    swapped = true
    htmlEl.classList.remove('dark')
  })

  assert.ok(swapped, 'harus langsung swap')
  assert.equal(overlay(), undefined, 'tidak boleh ada overlay')
  assert.ok(!htmlEl.classList.contains('dark'))
})

test('toggle berulang tidak menumpuk overlay', async () => {
  reset()

  playThemeFade('light', () => htmlEl.classList.remove('dark'))
  const first = overlay()
  playThemeFade('dark', () => htmlEl.classList.add('dark'))

  const all = body.children.filter((c) => c.className === 'theme-fade')
  assert.equal(all.length, 1, 'harus tetap satu overlay')
  assert.notEqual(all[0], first, 'overlay lama dibuang, bukan ditumpuk')
  assert.equal(all[0].dataset.state, 'in', 'restart dari fase fade-in')
  assert.equal(all[0].style.getPropertyValue('--fade-bg'), THEME_BG.dark, 'warna ikut target terbaru')
  // Swap lama harus dieksekusi seketika, bukan dibuang — kalau tidak
  // kelas .dark nyangkut dan toggle kedua tidak mengubah apa pun.
  assert.ok(!htmlEl.classList.contains('dark'), 'swap pending harus di-flush saat fade baru mulai')

  await sleep(700)
  assert.equal(overlay(), undefined, 'overlay dibersihkan di akhir')
  assert.ok(htmlEl.classList.contains('dark'), 'toggle terakhir (dark) yang menang')
})

test('swap terjadi tepat di akhir fade-in, bukan sebelum (pakai animationend)', async () => {
  reset()
  const events = []

  playThemeFade('light', () => {
    events.push('swap')
    htmlEl.classList.remove('dark')
  })

  const el = overlay()
  assert.deepEqual(events, [], 'belum ada swap sebelum fade-in selesai')

  // Browser memancarkan animationend saat fade-in selesai -> swap.
  el.dispatch('animationend', { animationName: 'theme-fade-in' })
  assert.deepEqual(events, ['swap'], 'swap tepat saat fade-in selesai')
  assert.equal(el.dataset.state, 'out')

  await sleep(700)
  assert.equal(overlay(), undefined, 'fade-out selesai -> overlay dibersihkan')
})

test('animationend dari elemen lain diabaikan', async () => {
  reset()
  const events = []

  playThemeFade('light', () => {
    events.push('swap')
    htmlEl.classList.remove('dark')
  })

  const el = overlay()
  const stray = new El('div')
  el.dispatch('animationend', { animationName: 'theme-fade-in', target: stray })

  assert.deepEqual(events, [], 'event dari target lain tidak boleh memicu advance')
  assert.equal(el.dataset.state, 'in')
  await sleep(700)
})

test('fade-out yang salah nama tidak mengakhiri animasi', async () => {
  reset()
  const events = []

  playThemeFade('light', () => {
    events.push('swap')
    htmlEl.classList.remove('dark')
  })

  const el = overlay()
  // animationend untuk fase yang belum dimulai harus diabaikan, kalau tidak
  // overlay hilang sebelum swap terjadi dan tema tidak pernah berganti.
  el.dispatch('animationend', { animationName: 'theme-fade-out' })
  assert.deepEqual(events, [], 'fade-out tidak boleh memicu advance sebelum swap')
  assert.equal(el.dataset.state, 'in')
  await sleep(700)
  assert.deepEqual(events, ['swap'], 'swap tetap terjadi lewat jalur normal')
})

console.log('theme fade: OK')