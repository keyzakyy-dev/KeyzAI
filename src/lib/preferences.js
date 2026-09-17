/**
 * Preferensi akun (client): cache lokal + normalisasi. Sumber kebenaran ada di
 * server (D1, /api/preferences); cache hanya agar nilai tetap tampil saat
 * offline / sebelum server merespons. Saat logout, cache dibuang.
 */

import { MODELS, DEFAULT_MODEL } from './models.js'

export const PREF_DEFAULTS = {
  default_model: DEFAULT_MODEL,
  sidebar_width: 256,
}

const SIDEBAR_MIN = 220
const SIDEBAR_MAX = 420
const STORAGE_KEY = 'keyzai-prefs'

export function normalizePrefs(input = {}) {
  const model = MODELS.some((m) => m.id === input?.default_model)
    ? input.default_model
    : DEFAULT_MODEL
  const w = Number(input?.sidebar_width)
  const width = Number.isFinite(w) ? Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(w))) : PREF_DEFAULTS.sidebar_width
  return { default_model: model, sidebar_width: width }
}

export function loadPrefsCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? normalizePrefs(JSON.parse(raw)) : { ...PREF_DEFAULTS }
  } catch {
    return { ...PREF_DEFAULTS }
  }
}

export function savePrefsCache(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizePrefs(prefs)))
  } catch {
    // storage unavailable — cache tidak tersimpan
  }
}

export function clearPrefsCache() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage unavailable
  }
}

export function normalizeDisplayName(value) {
  return typeof value === 'string' ? value.trim().slice(0, 40) : ''
}

export function isValidDisplayName(value) {
  const name = normalizeDisplayName(value)
  return name.length >= 1
}