export const MODELS = [
  { id: 'qwen3.8-flash', label: 'Qwen 3.8 Flash' },
  { id: 'glm-5.3-flash', label: 'GLM 5.3 Flash' },
]
export const DEFAULT_MODEL = MODELS[0].id

export function loadModel() {
  try {
    const v = localStorage.getItem('keyzai-model')
    if (v && MODELS.some((m) => m.id === v)) return v
  } catch {}
  return DEFAULT_MODEL
}

export function saveModel(id) {
  try { localStorage.setItem('keyzai-model', id) } catch {}
}
