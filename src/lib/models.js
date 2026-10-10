// `tagline` dipakai surface aplikasi (berbahasa Indonesia); `taglineEn` dipakai
// landing yang berbahasa Inggris. Keduanya disimpan per model supaya satu
// perubahan copy tidak merusak surface lain. `isNew` menggantikan Former
// perbandingan string tagline — penanda "New" bukan lagi bergantung pada
// teks yang bisa berubah.
export const MODELS = [
  { id: 'qwen3.8-flash', label: 'Qwen 3.8 Flash', provider: 'Alibaba', free: true, logo: '/models/qwen.png', tagline: 'Cepat & serbaguna', taglineEn: 'Fast & versatile' },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', provider: 'DeepSeek', free: true, logo: '/models/deepseek.png', tagline: 'Reasoning terbaik', taglineEn: 'Strongest reasoning' },
  { id: 'Atria-Dawn-Preview', label: 'Atria Dawn Preview', provider: 'Z.ai', free: true, logo: '/models/atria.png', tagline: 'Baru & eksperimental', taglineEn: 'New & experimental', isNew: true },
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
