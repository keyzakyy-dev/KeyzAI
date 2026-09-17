/**
 * Akses D1: users + conversations.
 *
 * Pohon pesan (tree.js frontend) disimpan utuh sebagai JSON di messages_json,
 * termasuk children/parentId — cabang edit/regenerate selamat saat sinkron.
 * Kolom relasional (title, pinned, timestamps) dipakai untuk query list.
 */

// Conversations: row DB → object yang dipahami frontend.
export function rowToConv(row) {
  if (!row) return null
  let messages = {}
  try {
    messages = JSON.parse(row.messages_json || '{}')
  } catch {
    messages = {}
  }
  return {
    id: row.id,
    title: row.title || '',
    titlePending: !!row.title_pending,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pinned: !!row.pinned,
    rootId: row.root_id || null,
    activeLeafId: row.active_leaf_id || null,
    messages,
  }
}

export async function upsertUser(db, profile) {
  const now = Date.now()
  const id = `usr_${crypto.randomUUID()}`
  const res = await db
    .prepare(
      `INSERT INTO users (id, google_sub, email, name, picture, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(google_sub) DO UPDATE SET
         email = excluded.email,
         name = excluded.name,
         picture = excluded.picture
       RETURNING id, google_sub, email, name, picture`,
    )
    .bind(id, profile.google_sub, profile.email, profile.name, profile.picture, now)
    .first()
  return res
}

// List ringan tanpa messages_json (sidebar hanya butuh metadata).
export async function listConversations(db, userId) {
  const res = await db
    .prepare(
      `SELECT id, title, title_pending, created_at, updated_at, pinned, root_id, active_leaf_id
       FROM conversations
       WHERE user_id = ?
       ORDER BY pinned DESC, updated_at DESC`,
    )
    .bind(userId)
    .all()
  return (res.results || []).map(rowToConv)
}

export async function getConversation(db, userId, convId) {
  const row = await db
    .prepare(`SELECT * FROM conversations WHERE id = ? AND user_id = ?`)
    .bind(convId, userId)
    .first()
  return rowToConv(row)
}

// Upsert penuh: frontend kirim objek percakapan, kita simpan apa adanya.
export async function saveConversation(db, userId, conv) {
  const now = Date.now()
  await db
    .prepare(
      `INSERT INTO conversations (id, user_id, title, title_pending, created_at, updated_at, pinned, root_id, active_leaf_id, messages_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         title_pending = excluded.title_pending,
         updated_at = excluded.updated_at,
         pinned = excluded.pinned,
         root_id = excluded.root_id,
         active_leaf_id = excluded.active_leaf_id,
         messages_json = excluded.messages_json`,
    )
    .bind(
      conv.id,
      userId,
      conv.title || '',
      conv.titlePending ? 1 : 0,
      conv.createdAt || now,
      conv.updatedAt || now,
      conv.pinned ? 1 : 0,
      conv.rootId || null,
      conv.activeLeafId || null,
      JSON.stringify(conv.messages || {}),
    )
    .run()
}

export async function patchConversation(db, userId, convId, patch) {
  const sets = []
  const args = []
  if (typeof patch.title === 'string') {
    sets.push('title = ?')
    args.push(patch.title)
  }
  if (typeof patch.titlePending === 'boolean') {
    sets.push('title_pending = ?')
    args.push(patch.titlePending ? 1 : 0)
  }
  if (typeof patch.pinned === 'boolean') {
    sets.push('pinned = ?')
    args.push(patch.pinned ? 1 : 0)
  }
  if (!sets.length) return false
  sets.push('updated_at = ?')
  args.push(Date.now())
  args.push(convId, userId)
  const res = await db
    .prepare(`UPDATE conversations SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...args)
    .run()
  return res.meta.changes > 0
}

export async function deleteConversation(db, userId, convId) {
  const res = await db
    .prepare(`DELETE FROM conversations WHERE id = ? AND user_id = ?`)
    .bind(convId, userId)
    .run()
  return res.meta.changes > 0
}
