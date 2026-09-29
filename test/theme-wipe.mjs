/**
 * Logika overlay wipe tema.
 *
 * Diuji dengan DOM minimal (bukan jsdom — tidak ada dependency baru):
 * theme-wipe.js hanya butuh document.body, classList, style, dataset,
 * getComputedStyle, setTimeout, dan matchMedia. Semuanya di-stub di sini.
 *
 * Yang diuji: urutan cover -> swap -> reveal, pemilihan titik pusat,
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
  }
  setAttribute(k, v) {
    this._attrs[k] = v
  }
  getAttribute(k) {
    return this._attrs[k] ?? null
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

const { playThemeWipe } = await import('../src/lib/theme-wipe.js')

// ---- Helper ---------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const overlay = () => body.children.find((c) => c.className === 'theme-wipe')

function reset({ reducedMotion = false } = {}) {
  for (const c of [...body.children]) body.removeChild(c)
  htmlEl.classList.set = new Set(['dark'])
  document.activeElement = null
  globalThis.window.matchMedia = () => ({ matches: reducedMotion })
}

function clickButton(x, y, w = 32, h = 32) {
  const btn = new El('button')
  btn._rect = { left: x, top: y, width: w, height: h }
  document.activeElement = btn
  return btn
}

// ---- Test -----------------------------------------------------------------

test('overlay menutup, swap di tengah, lalu membuka', async () => {
  reset()
  const events = []

  playThemeWipe('light', () => {
    events.push('swap')
    htmlEl.classList.toggle('dark', false)
  })

  // Fase cover: overlay ada, state=cover, kelas .dark belum berubah.
  const el = overlay()
  assert.ok(el, 'overlay harus dibuat')
  assert.equal(el.dataset.state, 'cover')
  assert.equal(el.getAttribute('aria-hidden'), 'true')
  assert.equal(el.style.getPropertyValue('--wipe-bg'), THEME_BG.light)
  assert.ok(htmlEl.classList.contains('dark'), 'kelas .dark belum boleh berubah saat cover')
  assert.deepEqual(events, [])

  await sleep(500)

  // Setelah cover selesai: swap terjadi, state=reveal.
  assert.deepEqual(events, ['swap'], 'onSwap harus dipanggil sekali')
  assert.ok(!htmlEl.classList.contains('dark'), 'kelas .dark harus tertukar')
  assert.equal(el.dataset.state, 'reveal')

  await sleep(500)

  // Setelah reveal: overlay dibersihkan.
  assert.equal(overlay(), undefined, 'overlay harus di-remove setelah animasi selesai')
})

test('wipe ke dark memakai warna background dark', async () => {
  reset()
  htmlEl.classList.remove('dark')

  playThemeWipe('dark', () => htmlEl.classList.add('dark'))

  assert.equal(overlay().style.getPropertyValue('--wipe-bg'), THEME_BG.dark)
  await sleep(800)
  assert.ok(htmlEl.classList.contains('dark'))
})

test('titik pusat wipe mengikuti posisi tombol yang diklik', async () => {
  reset()
  clickButton(100, 200)

  playThemeWipe('light', () => htmlEl.classList.remove('dark'))

  const el = overlay()
  assert.equal(el.style.getPropertyValue('--wipe-x'), '116px') // 100 + 32/2
  assert.equal(el.style.getPropertyValue('--wipe-y'), '216px') // 200 + 32/2
  await sleep(800)
})

test('tanpa elemen fokus, titik pusat jatuh ke tengah viewport', async () => {
  reset()
  document.activeElement = null

  playThemeWipe('light', () => htmlEl.classList.remove('dark'))

  assert.equal(overlay().style.getPropertyValue('--wipe-x'), '600px')
  assert.equal(overlay().style.getPropertyValue('--wipe-y'), '400px')
  await sleep(800)
})

test('resolveTargetBg tidak meninggalkan kelas .dark dalam keadaan salah', async () => {
  reset()
  htmlEl.classList.add('dark')

  playThemeWipe('light', () => htmlEl.classList.remove('dark'))
  assert.equal(overlay().style.getPropertyValue('--wipe-bg'), THEME_BG.light)
  await sleep(800)
  assert.ok(!htmlEl.classList.contains('dark'), 'harus berakhir di light')
})

test('prefers-reduced-motion: swap langsung, tanpa overlay', async () => {
  reset({ reducedMotion: true })
  let swapped = false

  playThemeWipe('light', () => {
    swapped = true
    htmlEl.classList.remove('dark')
  })

  assert.ok(swapped, 'harus langsung swap')
  assert.equal(overlay(), undefined, 'tidak boleh ada overlay')
  assert.ok(!htmlEl.classList.contains('dark'))
})

test('toggle berulang tidak menumpuk overlay', async () => {
  reset()

  playThemeWipe('light', () => htmlEl.classList.remove('dark'))
  const first = overlay()
  playThemeWipe('dark', () => htmlEl.classList.add('dark'))

  const all = body.children.filter((c) => c.className === 'theme-wipe')
  assert.equal(all.length, 1, 'harus tetap satu overlay')
  assert.notEqual(all[0], first, 'overlay lama dibuang, bukan ditumpuk')
  assert.equal(all[0].dataset.state, 'cover', 'restart dari fase cover')
  assert.equal(all[0].style.getPropertyValue('--wipe-bg'), THEME_BG.dark, 'warna ikut target terbaru')

  await sleep(800)
  assert.equal(overlay(), undefined, 'overlay dibersihkan di akhir')
  assert.ok(htmlEl.classList.contains('dark'), 'toggle terakhir (dark) yang menang')
})

console.log('theme wipe: OK')
