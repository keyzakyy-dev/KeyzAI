export const MODELS = [
  { id: 'dahono/auto', label: 'Auto' },
  { id: 'dahono/ai-chat', label: 'Dahono AI Chat' },
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
