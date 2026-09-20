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
  // nama hanya diisi dari profil Google saat INSERT pertama. Pada login
  // berikutnya JANGAN ditimpa: kolom name adalah "nama tampilan" yang bisa
  // diubah user lewat preferensi (updatePreferences). Email/picture aman
  // diperbarui karena tidak pernah dikustom.
  const res = await db
    .prepare(
      `INSERT INTO users (id, google_sub, email, name, picture, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(google_sub) DO UPDATE SET
         email = excluded.email,
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

// ---------------------------------------------------------------------------
// Preferensi akun. Disimpan sebagai JSON di users.settings_json. Kolom nama
// ikut dijaga: display_name kustom adalah override nama dari Google.
// ---------------------------------------------------------------------------

const PREF_DEFAULTS = { default_model: 'qwen3.8-flash', sidebar_width: 256 }
const SIDEBAR_MIN = 220
const SIDEBAR_MAX = 420

export function normalizePrefs(input = {}) {
  const out = {}
  const model = typeof input?.default_model === 'string' ? input.default_model.trim().slice(0, 64) : ''
  out.default_model = model || PREF_DEFAULTS.default_model
  const w = Number(input?.sidebar_width)
  out.sidebar_width = Number.isFinite(w)
    ? Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(w)))
    : PREF_DEFAULTS.sidebar_width
  return out
}

export async function getPreferences(db, userId) {
  const row = await db
    .prepare(
      `SELECT id, google_sub, email, name, picture, settings_json, created_at
       FROM users WHERE id = ?`,
    )
    .bind(userId)
    .first()
  if (!row) return null
  let raw = {}
  try {
    raw = JSON.parse(row.settings_json || '{}')
  } catch {
    raw = {}
  }
  return {
    preferences: normalizePrefs(raw),
    user: { id: row.id, email: row.email, name: row.name, picture: row.picture },
  }
}

// Merge patch ke preferensi tersimpan; bila ada display_name, update users.name
// sekaligus (menjadi "nama tampilan" di seluruh klien). Mengembalikan hasil
// getPreferences (row terbaru) atau null bila user tak ditemukan.
export async function updatePreferences(db, userId, patch = {}) {
  const current = await db
    .prepare(`SELECT settings_json FROM users WHERE id = ?`)
    .bind(userId)
    .first()
  if (!current) return null
  let raw = {}
  try {
    raw = JSON.parse(current.settings_json || '{}')
  } catch {
    raw = {}
  }
  const next = normalizePrefs({ ...raw, ...patch })
  await db
    .prepare(`UPDATE users SET settings_json = ? WHERE id = ?`)
    .bind(JSON.stringify(next), userId)
    .run()
  if (typeof patch.display_name === 'string') {
    const name = patch.display_name.trim().slice(0, 40)
    if (name) {
      await db.prepare(`UPDATE users SET name = ? WHERE id = ?`).bind(name, userId).run()
    }
  }
  return getPreferences(db, userId)
}

export async function deleteAllConversations(db, userId) {
  const res = await db
    .prepare(`DELETE FROM conversations WHERE user_id = ?`)
    .bind(userId)
    .run()
  return res.meta.changes || 0
}

// ---------------------------------------------------------------------------
// PRD Projects (riwayat per akun Google). Seluruh objek project disimpan utuh
// sebagai JSON (sama seperti conversations) supaya semua tahap + jawaban selamat.
// Kolom relasional (name, timestamps) untuk query list & urutan riwayat.
// ---------------------------------------------------------------------------

export function rowToProject(row) {
  if (!row) return null
  let project = {}
  try {
    project = JSON.parse(row.project_json || '{}')
  } catch {
    project = {}
  }
  // Kolom relasional menang atas JSON untuk konsistensi list.
  project.id = row.id
  project.createdAt = row.created_at
  project.updatedAt = row.updated_at
  if (row.name) project.projectName = row.name
  return project
}

// List ringan (tanpa project_json) untuk riwayat.
export async function listProjects(db, userId) {
  const res = await db
    .prepare(`SELECT id, name, created_at, updated_at FROM prd_projects WHERE user_id = ? ORDER BY updated_at DESC`)
    .bind(userId)
    .all()
  return (res.results || []).map((r) => ({ id: r.id, projectName: r.name || '', createdAt: r.created_at, updatedAt: r.updated_at }))
}

export async function getProject(db, userId, projectId) {
  const row = await db
    .prepare(`SELECT * FROM prd_projects WHERE id = ? AND user_id = ?`)
    .bind(projectId, userId)
    .first()
  return rowToProject(row)
}

export async function saveProject(db, userId, project) {
  const now = Date.now()
  await db
    .prepare(
      `INSERT INTO prd_projects (id, user_id, name, created_at, updated_at, project_json)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         updated_at = excluded.updated_at,
         project_json = excluded.project_json`,
    )
    .bind(
      project.id,
      userId,
      (project.projectName || '').slice(0, 120),
      project.createdAt || now,
      project.updatedAt || now,
      JSON.stringify(project),
    )
    .run()
}

export async function deleteProject(db, userId, projectId) {
  const res = await db
    .prepare(`DELETE FROM prd_projects WHERE id = ? AND user_id = ?`)
    .bind(projectId, userId)
    .run()
  return res.meta.changes > 0
}
