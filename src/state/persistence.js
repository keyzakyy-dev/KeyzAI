/**
 * Persistence percakapan ke localStorage, versioned + migrasi.
 *
 *   v3 (sekarang): { v: 3, convs: [conversation tree], activeId }
 *   v<=2 (legacy): { convs: [{ id, title, ..., messages: [linear] }], activeId }
 *
 * Setiap muat divalidasi: data rusak / versi tak dikenal → state segar, bukan
 * crash. Format lama di-migrate ke pohon pesan sebagai rantai tunggal.
 */

import { MSG_STATE, fallbackTitle, newConversation } from './tree.js'
import { newId } from './ids.js'

const STATE_KEY = 'keyzai-state'
const SCHEMA_VERSION = 3

export function freshState() {
  return { v: SCHEMA_VERSION, convs: [], activeId: null }
}

function firstUserContent(messages) {
  const first = Object.values(messages || {}).find((m) => m.role === 'user')
  return first?.content || ''
}

// Validasi + normalisasi satu percakapan format v3.
function normalizeConv(conv) {
  if (!conv || typeof conv !== 'object' || !conv.id) return null
  if (!conv.messages || typeof conv.messages !== 'object' || Array.isArray(conv.messages)) return null

  const messages = {}
  for (const [id, m] of Object.entries(conv.messages)) {
    if (!m || m.id !== id || !['user', 'assistant'].includes(m.role)) continue
    if (typeof m.content !== 'string') continue
    messages[id] = {
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: typeof m.timestamp === 'number' ? m.timestamp : Date.now(),
      parentId: typeof m.parentId === 'string' ? m.parentId : null,
      children: Array.isArray(m.children) ? m.children.filter((c) => typeof c === 'string') : [],
      state: Object.values(MSG_STATE).includes(m.state) ? m.state : MSG_STATE.DONE,
    }
  }

  const rootId = typeof conv.rootId === 'string' && messages[conv.rootId] ? conv.rootId : null
  if (!rootId && Object.keys(messages).length > 0) return null // pohon tanpa root = rusak

  let activeLeafId = typeof conv.activeLeafId === 'string' ? conv.activeLeafId : null
  if (activeLeafId && !messages[activeLeafId]) activeLeafId = null
  if (!activeLeafId && rootId) {
    // self-heal: ambil daun terdalam dari root
    let cur = rootId
    let last = rootId
    const seen = new Set()
    while (cur && !seen.has(cur)) {
      seen.add(cur)
      last = cur
      const kids = messages[cur].children
      cur = kids.length ? kids[kids.length - 1] : null
    }
    activeLeafId = last
  }

  return {
    id: conv.id,
    title: typeof conv.title === 'string' && conv.title.trim() ? conv.title : fallbackTitle(firstUserContent(messages)),
    titlePending: false,
    createdAt: typeof conv.createdAt === 'number' ? conv.createdAt : Date.now(),
    updatedAt: typeof conv.updatedAt === 'number' ? conv.updatedAt : conv.createdAt || Date.now(),
    pinned: !!conv.pinned,
    rootId,
    activeLeafId,
    messages,
  }
}

// Legacy { messages: [linear] } → pohon rantai tunggal. Bubble mati (konten
// kosong / role asing) dibuang; state diseragamkan jadi 'done'.
function migrateLegacyConv(conv) {
  if (!conv || typeof conv !== 'object' || !conv.id) return null
  if (conv.messages && !Array.isArray(conv.messages)) return normalizeConv(conv)

  const list = Array.isArray(conv.messages) ? conv.messages : []
  const messages = {}
  let prevId = null
  let rootId = null
  for (const m of list) {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string') continue
    if (!m.content.trim()) continue
    const id = typeof m.id === 'string' ? m.id : newId('msg')
    messages[id] = {
      id,
      role: m.role,
      content: m.content,
      timestamp: typeof m.timestamp === 'number' ? m.timestamp : Date.now(),
      parentId: prevId,
      children: [],
      state: MSG_STATE.DONE,
    }
    if (prevId) messages[prevId].children.push(id)
    else rootId = id
    prevId = id
  }

  return {
    id: conv.id,
    title: typeof conv.title === 'string' && conv.title.trim() ? conv.title : fallbackTitle(firstUserContent(messages)),
    titlePending: false,
    createdAt: typeof conv.createdAt === 'number' ? conv.createdAt : Date.now(),
    updatedAt: typeof conv.updatedAt === 'number' ? conv.updatedAt : conv.createdAt || Date.now(),
    pinned: !!conv.pinned,
    rootId,
    activeLeafId: prevId,
    messages,
  }
}

export function loadState(storage) {
  // storage disuntik (default: localStorage) supaya bisa di-test di node.
  let raw = null
  try {
    raw = (storage || localStorage).getItem(STATE_KEY)
  } catch {
    // storage tidak tersedia (private mode) — mulai dari state segar
    return freshState()
  }
  if (!raw) return freshState()

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return freshState() // JSON rusak: jangan biarkan aplikasi crash
  }
  if (!parsed || typeof parsed !== 'object') return freshState()

  // Versi tak dikenal di masa depan: muat hanya bila schema cocok.
  if (parsed.v === SCHEMA_VERSION) {
    const convs = (Array.isArray(parsed.convs) ? parsed.convs : [])
      .map(normalizeConv)
      .filter(Boolean)
    return { v: SCHEMA_VERSION, convs, activeId: convs.some((c) => c.id === parsed.activeId) ? parsed.activeId : null }
  }

  const convs = (Array.isArray(parsed.convs) ? parsed.convs : [])
    .map(migrateLegacyConv)
    .filter(Boolean)
  return { v: SCHEMA_VERSION, convs, activeId: convs.some((c) => c.id === parsed.activeId) ? parsed.activeId : null }
}

// Mengembalikan error bila gagal (mis. quota penuh) — caller yang menyampaikan
// ke pengguna, bukan menelan data diam-diam.
export function saveState(state, storage) {
  try {
    ;(storage || localStorage).setItem(
      STATE_KEY,
      JSON.stringify({ v: SCHEMA_VERSION, convs: state.convs, activeId: state.activeId }),
    )
    return null
  } catch (err) {
    return err
  }
}

// Hapus data percakapan lokal (dipakai saat logout supaya riwayat akun
// tidak tertinggal di perangkat / tampil ke pengguna anonim).
export function clearState(storage) {
  try {
    ;(storage || localStorage).removeItem(STATE_KEY)
  } catch {
    // abaikan — storage tidak tersedia (private mode)
  }
}
