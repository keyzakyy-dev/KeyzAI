/**
 * Sinkronisasi percakapan ke backend (D1). Server-authoritative setelah login:
 * - loadConversations: hydrate store dari D1 saat login
 * - saveConversation: upsert pohon utuh setelah turn selesai / pin / rename
 *
 * Format tree (messages sebagai peta) diteruskan apa adanya; worker menyimpan
 * JSON-nya utuh supaya cabang edit/regenerate selamat.
 */

import { authFetch } from './auth'

const API_URL = import.meta.env?.VITE_WORKER_URL || 'https://keyzai-worker-prod.2406007.workers.dev'

async function parse(res) {
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Permintaan gagal')
  return data
}

export async function fetchConversations() {
  const data = await parse(await authFetch(`${API_URL}/api/conversations`))
  return data.conversations || []
}

export async function fetchConversation(id) {
  const data = await parse(await authFetch(`${API_URL}/api/conversations/${encodeURIComponent(id)}`))
  return data.conversation || null
}

export async function saveConversation(conv) {
  await parse(
    await authFetch(`${API_URL}/api/conversations/${encodeURIComponent(conv.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conv),
    }),
  )
}

export async function patchConversation(id, patch) {
  await parse(
    await authFetch(`${API_URL}/api/conversations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  )
}

export async function removeConversation(id) {
  await parse(
    await authFetch(`${API_URL}/api/conversations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  )
}

export async function deleteAllConversations() {
  const data = await parse(
    await authFetch(`${API_URL}/api/conversations`, {
      method: 'DELETE',
    }),
  )
  return data.deleted || 0
}

export async function fetchPreferences() {
  const data = await parse(await authFetch(`${API_URL}/api/preferences`))
  return data
}

// patch: { default_model?, sidebar_width?, display_name? }.
// Mengembalikan { preferences, user } dari server.
export async function savePreferences(patch) {
  const data = await parse(
    await authFetch(`${API_URL}/api/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  )
  return data
}

// ---------------------------------------------------------------------------
// Riwayat PRD per akun Google. Meniru pola percakapan: list ringan, detail
// utuh, upsert penuh, hapus.
// ---------------------------------------------------------------------------

export async function fetchPrdProjects() {
  const data = await parse(await authFetch(`${API_URL}/api/prd/projects`))
  return data.projects || []
}

export async function fetchPrdProject(id) {
  const data = await parse(await authFetch(`${API_URL}/api/prd/projects/${encodeURIComponent(id)}`))
  return data.project || null
}

export async function savePrdProject(project) {
  await parse(
    await authFetch(`${API_URL}/api/prd/projects/${encodeURIComponent(project.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    }),
  )
}

export async function deletePrdProject(id) {
  await parse(
    await authFetch(`${API_URL}/api/prd/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  )
}
