export const MODELS = [
  { id: 'dahono/auto', label: 'Auto' },
  { id: 'dahono/ai-chat', label: 'Dahono AI Chat' },
  { id: 'dahono/deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { id: 'dahono/deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { id: 'dahono/glm-5.3', label: 'GLM 5.3' },
  { id: 'dahono/glm-5.3-flash', label: 'GLM 5.3 Flash' },
  { id: 'dahono/qwen3.8-max', label: 'Qwen 3.8 Max' },
  { id: 'dahono/kimi-k3', label: 'Kimi K3' },
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
