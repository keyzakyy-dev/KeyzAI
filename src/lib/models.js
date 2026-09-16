export const MODELS = [
  { id: 'dahono/ai-chat', label: 'Dahono AI Chat' },
  { id: 'dahono/qwen3.7-max', label: 'Qwen 3.7 Max' },
  { id: 'dahono/deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { id: 'dahono/deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { id: 'dahono/kimi-k2.6', label: 'Kimi K2.6' },
  { id: 'dahono/mimo-v2.5-pro', label: 'Mimo V2.5 Pro' },
  { id: 'dahono/glm-5.2', label: 'GLM 5.2' },
  { id: 'dahono/kimi-k2.7-code', label: 'Kimi K2.7 Code' },
  { id: 'dahono/kimi-k2.7-code-highspeed', label: 'Kimi K2.7 Code Highspeed' },
  { id: 'dahono/hy3', label: 'Tencent HY3' },
  { id: 'dahono/auto', label: 'Auto' },
  { id: 'dahono/kimi-k3', label: 'Kimi K3' },
  { id: 'dahono/qwen3.8-max', label: 'Qwen 3.8 Max' },
  { id: 'dahono/deepseek-v4-pro-0813', label: 'DeepSeek V4 Pro 0813' },
  { id: 'dahono/glm-5.3', label: 'GLM 5.3' },
  { id: 'dahono/deepseek-v4-flash-0731', label: 'DeepSeek V4 Flash 0731' },
  { id: 'dahono/deepseek-v4-custom', label: 'DeepSeek V4 Custom' },
  { id: 'dahono/glm-5.1', label: 'GLM 5.1' },
  { id: 'dahono/deepseek-v4-flash-vision', label: 'DeepSeek V4 Flash Vision' },
  { id: 'dahono/glm-5.3-flash', label: 'GLM 5.3 Flash' },
  { id: 'dahono/glm-5.2-custom', label: 'GLM 5.2 Custom' },
  { id: 'dahono/glm-5.3-custom', label: 'GLM 5.3 Custom' },
  { id: 'dahono/kimi-k3-custom', label: 'Kimi K3 Custom' },
  { id: 'dahono/hy4', label: 'Tencent HY4' },
  { id: 'dahono/union-alpha', label: 'Union Alpha' },
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
