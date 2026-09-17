/**
 * Model percakapan sebagai pohon pesan (message tree), seperti riwayat
 * edit/regenerate ChatGPT: setiap edit atau "buat ulang" membuat cabang baru,
 * pesan lama tidak pernah hilang. Hanya satu rantai (root → activeLeafId) yang
 * dirender sebagai percakapan aktif.
 *
 * message     : { id, role, content, timestamp, parentId, children: [id], state }
 * conversation: { id, title, titlePending, createdAt, updatedAt, pinned,
 *                 rootId, activeLeafId, messages: { [id]: message } }
 */

export const MSG_STATE = {
  STREAMING: 'streaming',
  DONE: 'done',
  ABORTED: 'aborted',
  ERROR: 'error',
}

const ACTIVE_ROLES = ['user', 'assistant']
const MAX_TREE_WALK = 500

// Batas sama dengan worker: user 2000, assistant 32000. Jawaban panjang
// (max_tokens 16384 bisa tembus 32k char) dipotong di sini, bukan ditolak.
const ROLE_LIMITS = { user: 2000, assistant: 32000 }
const CUT_MARK = '\n\n[…dipotong…]'

export function newMessage({ id, role, content = '', timestamp, parentId = null, state }) {
  if (!ACTIVE_ROLES.includes(role)) throw new Error(`Invalid role: ${role}`)
  return {
    id,
    role,
    content,
    timestamp,
    parentId,
    children: [],
    state: state || (role === 'assistant' ? MSG_STATE.STREAMING : MSG_STATE.DONE),
  }
}

export function newConversation(id, { title = '', createdAt = Date.now() } = {}) {
  return {
    id,
    title,
    titlePending: false,
    createdAt,
    updatedAt: createdAt,
    pinned: false,
    rootId: null,
    activeLeafId: null,
    messages: {},
  }
}

// Judul darurat dari teks user pertama (sampai 30 char + elipsis).
export function fallbackTitle(content) {
  const c = String(content ?? '')
  if (!c.trim()) return 'Chat'
  return c.length > 30 ? c.slice(0, 30) + '...' : c
}

// Cicilan tertua dari sebuah node ke root (guard siklus & record hilang).
function walkToRoot(messages, id) {
  const out = []
  const seen = new Set()
  let cur = id
  while (cur && !seen.has(cur) && out.length < MAX_TREE_WALK) {
    const m = messages[cur]
    if (!m) break
    seen.add(cur)
    out.unshift(m)
    cur = m.parentId
  }
  return out
}

// Daun terdalam dari sebuah node: turuti anak terakhir sampai habis.
export function deepestLeaf(messages, id) {
  const seen = new Set()
  let cur = id
  while (cur && !seen.has(cur)) {
    const m = messages[cur]
    if (!m || !m.children?.length) return cur
    seen.add(cur)
    cur = m.children[m.children.length - 1]
  }
  return cur
}

// Rantai aktif root → activeLeafId, yaitu percakapan yang dirender pengguna.
export function getActivePath(conv) {
  const messages = conv?.messages
  if (!messages || !conv.activeLeafId) return []
  return walkToRoot(messages, conv.activeLeafId)
}

// Konteks untuk API: pesan dari anchor ke root (_termasuk_ anchor), maks `limit`
// pesan terakhir. Hook pengiriman menambahkan pesan user baru bila perlu.
// Konten yang melebihi batas worker dipotong (penolakan 400 "Invalid messages"
// tidak boleh terjadi hanya karena satu jawaban panang di riwayat).
export function getContextFromAnchor(conv, anchorId, limit = 20) {
  const messages = conv?.messages
  if (!messages || !anchorId) return []
  return walkToRoot(messages, anchorId)
    .filter((m) => ACTIVE_ROLES.includes(m.role))
    .slice(-limit)
    .map((m) => {
      const max = ROLE_LIMITS[m.role]
      const content = typeof m.content === 'string' ? m.content : ''
      if (content.length > max) {
        return { role: m.role, content: content.slice(0, Math.max(0, max - CUT_MARK.length)) + CUT_MARK }
      }
      return { role: m.role, content }
    })
}

// Pasang pesan ke pohon: link parent ← child, set root bila root pertama,
// dan pindahkan activeLeafId ke pesan baru.
export function attachMessage(conv, msg) {
  if (!msg?.id) return conv
  const messages = { ...conv.messages, [msg.id]: msg }
  let rootId = conv.rootId

  if (msg.parentId) {
    const parent = messages[msg.parentId]
    if (parent) {
      messages[msg.parentId] = { ...parent, children: [...parent.children, msg.id] }
    } else {
      // parent hilang (data rusak) — pesan jadi root baru
      rootId = msg.id
    }
  } else {
    rootId = msg.id
  }

  return { ...conv, messages, rootId, activeLeafId: msg.id, updatedAt: Date.now() }
}

// Buang sebuah pesan beserta seluruh turunannya, koreksi activeLeafId ke
// daun terdekat yang tersisa. Dipakai untuk bubble AI kosong (abort / jawaban
// kosong) agar tidak meninggalkan pesan mati.
export function detachSubtree(conv, msgId) {
  const messages = { ...conv.messages }
  const target = messages[msgId]
  if (!target) return conv

  const orphans = [msgId, ...collectChildren(messages, msgId)]
  const parentId = target.parentId
  if (parentId && messages[parentId]) {
    messages[parentId] = {
      ...messages[parentId],
      children: messages[parentId].children.filter((c) => !orphans.includes(c)),
    }
  }
  orphans.forEach((id) => delete messages[id])

  const rootId = conv.rootId && messages[conv.rootId] ? conv.rootId : null
  let activeLeafId = null
  if (rootId) {
    const back = parentId && messages[parentId] ? parentId : rootId
    activeLeafId = deepestLeaf(messages, back)
  }

  return { ...conv, messages, rootId, activeLeafId, updatedAt: Date.now() }
}

function collectChildren(messages, id) {
  const out = []
  const stack = [...(messages[id]?.children || [])]
  const seen = new Set()
  while (stack.length) {
    const cur = stack.pop()
    if (seen.has(cur)) continue
    seen.add(cur)
    out.push(cur)
    const m = messages[cur]
    if (m) stack.push(...(m.children || []))
  }
  return out
}

// Navigasi cabang: pindah ke sibling sebelum/sesudah pesan ini, lalu turun ke
// daunnya. Mengembalikan activeLeafId baru, atau null bila tidak ada sibling.
export function navigateBranch(conv, msgId, dir) {
  const messages = conv?.messages
  const m = messages?.[msgId]
  if (!m?.parentId) return null
  const parent = messages[m.parentId]
  if (!parent) return null

  const idx = parent.children.indexOf(msgId)
  if (idx === -1) return null
  const next = dir === 'next' ? idx + 1 : idx - 1
  if (next < 0 || next >= parent.children.length) return null

  return deepestLeaf(messages, parent.children[next])
}

// Apakah pesan ini punya sibling (panah navigasi ditampilkan)?
export function hasSiblings(conv, msgId) {
  const messages = conv?.messages
  const m = messages?.[msgId]
  if (!m?.parentId) return false
  const parent = messages[m.parentId]
  return !!parent && parent.children.length > 1
}

// Tampilan flat siap export: hanya rantai aktif, tanpa field internal pohon.
export function serializeConv(conv) {
  return {
    id: conv.id,
    title: conv.title,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    pinned: conv.pinned,
    messages: getActivePath(conv).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    })),
  }
}
