import { useCallback, useEffect, useRef, useState } from 'react'
import { isAuthenticated } from '../lib/auth'
import { fetchPreferences, savePreferences } from '../lib/sync'
import {
  PREF_DEFAULTS,
  clearPrefsCache,
  loadPrefsCache,
  normalizeDisplayName,
  normalizePrefs,
  savePrefsCache,
} from '../lib/preferences'

/**
 * Preferensi akun: awal dari cache lokal (agar tampil instan & offline),
 * lalu direfresh dari server saat session ada. onHydrated dipanggil SATU KALI
 * saat preferensi server pertama berhasil dimuat — tempat menerapkan default
 * (model & lebar sidebar) untuk perangkat baru.
 */
export function usePreferences({ onHydrated } = {}) {
  const [prefs, setPrefs] = useState(() => (isAuthenticated() ? loadPrefsCache() : { ...PREF_DEFAULTS }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const gotServer = useRef(false)
  const onHydratedRef = useRef(onHydrated)
  useEffect(() => {
    onHydratedRef.current = onHydrated
  }, [onHydrated])

  const refresh = useCallback(async () => {
    try {
      const data = await fetchPreferences()
      const next = normalizePrefs(data.preferences)
      savePrefsCache(next)
      setPrefs(next)
      if (!gotServer.current) {
        gotServer.current = true
        onHydratedRef.current?.(next, data.user)
      }
    } catch {
      // offline / gagal: cache lokal tetap dipakai
    }
  }, [])

  const update = useCallback(
    async (patch) => {
      const optimistic = normalizePrefs({ ...prefs, ...patch })
      setPrefs(optimistic)
      setError(null)
      setSaving(true)
      try {
        const data = await savePreferences(patch)
        const final = normalizePrefs(data.preferences)
        savePrefsCache(final)
        setPrefs(final)
        return data.user || null
      } catch (e) {
        // rollback ke cache terakhir (atau default)
        const prev = loadPrefsCache()
        setPrefs(prev)
        setError(e.message || 'Gagal menyimpan preferensi')
        throw e
      } finally {
        setSaving(false)
      }
    },
    [prefs],
  )

  const saveDisplayName = useCallback(
    async (name) => {
      const clean = normalizeDisplayName(name)
      if (!clean) {
        setError('Nama tidak boleh kosong')
        return null
      }
      return update({ display_name: clean })
    },
    [update],
  )

  const reset = useCallback(() => {
    gotServer.current = false
    clearPrefsCache()
    setPrefs({ ...PREF_DEFAULTS })
    setError(null)
    setSaving(false)
  }, [])

  // Mount saat session sudah ada → muat dari server (perangkat lama/baru).
  useEffect(() => {
    if (isAuthenticated()) refresh()
  }, [refresh])

  return { prefs, saving, error, refresh, update, saveDisplayName, reset }
}