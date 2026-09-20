import { useCallback, useEffect, useRef, useState } from 'react'

import { isAuthenticated } from '../lib/auth.js'
import { deletePrdProject, fetchPrdProjects, savePrdProject } from '../lib/sync.js'
import { loadPrdState, removeProject } from '../state/prd-persistence.js'

/**
 * Riwayat PRD per akun (metadata ringan: id, nama, timestamps). Server = sumber
 * kebenaran saat login; project lokal yang belum tersinkron ikut ter-upload
 * sekali. Saat offline / belum login, menampilkan project lokal saja.
 *
 * Dipakai Sidebar (lewat ChatInterface) & usePrdProject (sinkronisasi project
 * aktif). Satu hook = satu tempat merge server + lokal.
 */
export function usePrdHistory() {
  const [history, setHistory] = useState([])
  const [hydrated, setHydrated] = useState(false)
  const lastSynced = useRef(new Map())

  const refresh = useCallback(async () => {
    if (!isAuthenticated()) {
      setHistory(localMetas())
      setHydrated(true)
      return
    }
    try {
      const list = await fetchPrdProjects()
      const metas = Array.isArray(list) ? list : []
      for (const m of metas) lastSynced.current.set(m.id, `${m.id}:${m.updatedAt || m.createdAt || 0}`)
      // Project lokal yang belum ada di server (dibuat sebelum login / sebelum
      // fitur ini) → upload sekali lalu gabungkan ke riwayat.
      const { projects } = loadPrdState()
      const localOnly = Object.values(projects).filter((p) => p?.id && p?.projectIdea && !lastSynced.current.has(p.id))
      for (const p of localOnly) {
        savePrdProject(p).catch(() => {})
      }
      setHistory(mergeMetas(metas, localOnly.map(toMeta)))
    } catch {
      // jaringan gagal → riwayat tetap dari lokal
      setHistory(localMetas())
    }
    setHydrated(true)
  }, [])

  // Memuat saat mount, dan ulang setelah login (status session berubah).
  // refresh stabil (useCallback) & membaca session terbaru tiap pemanggilan.
  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh, isAuthenticated()])

  // Upsert meta project ke riwayat (setelah save ke server sukses).
  const upsert = useCallback((project) => {
    setHistory((h) => upsertMeta(h, project))
  }, [])

  // Tanda tangan sinkronisasi per project (supaya tidak upload ulang yang
  // belum berubah).
  const isSynced = useCallback((id, sig) => lastSynced.current.get(id) === sig, [])
  const markSynced = useCallback((id, sig) => {
    lastSynced.current.set(id, sig)
  }, [])
  const unmarkSynced = useCallback((id) => {
    lastSynced.current.delete(id)
  }, [])

  const remove = useCallback((id) => {
    removeProject(id)
    setHistory((h) => h.filter((m) => m.id !== id))
    if (isAuthenticated()) deletePrdProject(id).catch(() => {})
  }, [])

  return { history, hydrated, refresh, upsert, remove, isSynced, markSynced, unmarkSynced }
}

function localMetas() {
  const { projects } = loadPrdState()
  return Object.values(projects)
    .filter((p) => p?.id && p?.projectIdea)
    .map(toMeta)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

// Meta ringan untuk daftar riwayat (tanpa isi project).
function toMeta(p) {
  return { id: p.id, projectName: p.projectName || '', createdAt: p.createdAt, updatedAt: p.updatedAt }
}

// Gabung meta server + lokal (server menang bila id sama), urut terbaru.
function mergeMetas(server, local) {
  const byId = new Map()
  for (const m of server) byId.set(m.id, m)
  for (const m of local) if (!byId.has(m.id)) byId.set(m.id, m)
  return [...byId.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

function upsertMeta(list, project) {
  const next = list.filter((m) => m.id !== project.id)
  next.unshift(toMeta(project))
  return next
}
