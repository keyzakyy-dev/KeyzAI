/**
 * Persistence project PRD Builder ke localStorage, versioned + validasi
 * (pola sama dengan state/persistence.js untuk percakapan).
 *
 *   { v: 1, projects: { [id]: project }, activeId }
 *
 * Project yang rusak/tidak lengkap dilepas, bukan mengcrash app. activeId tidak
 * dipulihkan: buka /prd-builder selalu mulai project baru (riwayat tetap ada
 * dan bisa dibuka lewat deep-link /prd-builder/:id).
 */

import { createEmptyProject } from './prd-model.js'

const STATE_KEY = 'keyzai-prd'
const SCHEMA_VERSION = 1

export function freshPrdState() {
  return { v: SCHEMA_VERSION, projects: {}, activeId: null }
}

// Validasi minimum sebuah project: harus punya id + ide (project yang
// baru selesai ketik ide pun sudah layak disimpan).
function isValidProject(p) {
  if (!p || typeof p !== 'object') return false
  if (typeof p.id !== 'string' || !p.id) return false
  if (typeof p.projectIdea !== 'string' || !p.projectIdea.trim()) return false
  return true
}

export function loadPrdState(storage) {
  let raw = null
  try {
    raw = (storage || localStorage).getItem(STATE_KEY)
  } catch {
    return freshPrdState()
  }
  if (!raw) return freshPrdState()

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return freshPrdState()
  }
  if (!parsed || typeof parsed !== 'object' || parsed.v !== SCHEMA_VERSION) {
    return freshPrdState()
  }

  const projects = {}
  for (const [id, p] of Object.entries(parsed.projects || {})) {
    if (isValidProject(p)) projects[id] = p
  }
  return { v: SCHEMA_VERSION, projects, activeId: null }
}

// Mengembalikan error bila gagal (mis. quota) — caller yang menyampaikannya.
export function savePrdState(state, storage) {
  try {
    ;(storage || localStorage).setItem(
      STATE_KEY,
      JSON.stringify({
        v: SCHEMA_VERSION,
        projects: state.projects || {},
        activeId: state.activeId || null,
      }),
    )
    return null
  } catch (err) {
    return err
  }
}

export function clearPrdState(storage) {
  try {
    ;(storage || localStorage).removeItem(STATE_KEY)
  } catch {
    // storage unavailable (private mode)
  }
}

// Ambil satu project tersimpan (dipakai deep-link /prd-builder/:id).
export function loadProject(id, storage) {
  if (!id) return null
  const { projects } = loadPrdState(storage)
  return projects[id] || null
}

// Hapus satu project dari penyimpanan lokal.
export function removeProject(id, storage) {
  if (!id) return
  const state = loadPrdState(storage)
  if (!state.projects[id]) return
  delete state.projects[id]
  if (state.activeId === id) state.activeId = null
  savePrdState(state, storage)
}
