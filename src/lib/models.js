export const MODELS = [
  { id: 'Atria-Dawn-Preview', label: 'Atria Dawn Preview' },
]
export const DEFAULT_MODEL = MODELS[0].id

export function loadModel() {
  try {
    const v = localStorage.getItem('keyzai-model')
    if (v && MODELS.some((m) => m.id === v)) return v
  } catch {}
  return DEFAULT_MODEL
}

// True bila user pernah memilih model eksplisit di perangkat ini (dipakai
// untuk memutuskan apakah preferensi akun boleh meng-override default).
export function isModelStored() {
  try {
    return localStorage.getItem('keyzai-model') != null
  } catch {
    return false
  }
}

export function saveModel(id) {
  try { localStorage.setItem('keyzai-model', id) } catch {}
}
