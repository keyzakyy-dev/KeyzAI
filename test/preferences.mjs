// Self-check preferensi: node test/preferences.mjs
import assert from 'node:assert/strict'
import {
  PREF_DEFAULTS,
  normalizePrefs,
  normalizeDisplayName,
  isValidDisplayName,
} from '../src/lib/preferences.js'

// default saat input kosong
let p = normalizePrefs({})
assert.equal(p.default_model, PREF_DEFAULTS.default_model)
assert.equal(p.sidebar_width, PREF_DEFAULTS.sidebar_width)

// model valid dipertahankan; model tak dikenal jatuh ke default
p = normalizePrefs({ default_model: 'qwen3.8-flash' })
assert.equal(p.default_model, 'qwen3.8-flash')
p = normalizePrefs({ default_model: 'gpt-42' })
assert.equal(p.default_model, PREF_DEFAULTS.default_model)

// lebar sidebar di-clamp
p = normalizePrefs({ sidebar_width: 10 })
assert.equal(p.sidebar_width, 220)
p = normalizePrefs({ sidebar_width: 9999 })
assert.equal(p.sidebar_width, 420)
p = normalizePrefs({ sidebar_width: 300.4 })
assert.equal(p.sidebar_width, 300)
p = normalizePrefs({ sidebar_width: 'abc' })
assert.equal(p.sidebar_width, PREF_DEFAULTS.sidebar_width)

// merge parsial mempertahankan nilai lain
p = normalizePrefs({ ...PREF_DEFAULTS, default_model: 'qwen3.8-flash' })
assert.equal(p.sidebar_width, PREF_DEFAULTS.sidebar_width)

// nama tampilan
assert.equal(normalizeDisplayName('  Budi  '), 'Budi')
assert.equal(normalizeDisplayName('x'.repeat(80)), 'x'.repeat(40))
assert.equal(isValidDisplayName('  '), false)
assert.equal(isValidDisplayName('A'), true)

console.log('preferences: OK')
