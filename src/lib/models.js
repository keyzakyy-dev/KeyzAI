export const MODELS = [
  { id: 'deepseek/deepseek-v4-flash-free', label: 'DeepSeek V4 Flash' },
  { id: 'tencent/hy3-free', label: 'Tencent HY3' },
  { id: 'z-ai/glm-5.3-flash-free', label: 'GLM 5.3 Flash' },
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
