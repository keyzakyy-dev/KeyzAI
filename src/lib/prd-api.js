/**
 * Client AI service untuk PRD Builder. Semua panggilan AI lewat sini:
 * UI hanya mengirim stage + objek project, prompt ada di worker.
 *
 * Auth: memakai authFetch (Bearer session). Jika belum login, caller
 * (usePrdProject) menampilkan LoginDialog — sama dengan alur /chat.
 */

import { authFetch } from './auth'

const API_URL = import.meta.env?.VITE_WORKER_URL || 'https://keyzai-worker-prod.2406007.workers.dev'

function timeout(ms) {
  return typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined
}

async function httpError(res) {
  let msg = `Error server: ${res.status}`
  try {
    const data = await res.json()
    if (data.error) msg = data.error
  } catch {
    // keep generic
  }
  return new Error(msg)
}

/**
 * Panggil satu tahap pipeline PRD.
 * @param {string} stage  analyze | questions | tech | structure | prd | regenerate
 * @param {object} project objek project (lihat state/prd-model.js)
 * @param {object} opts    { instruction, sectionTitle, sectionContent } untuk regenerate
 * @returns data JSON mentah dari AI (dengan field sudah divalidasi di worker)
 */
export async function callPrdStage(stage, project, opts = {}) {
  const res = await authFetch(`${API_URL}/api/prd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stage,
      project: { ...project, model: project.model },
      instruction: opts.instruction,
      sectionTitle: opts.sectionTitle,
      sectionContent: opts.sectionContent,
    }),
    signal: timeout(300000),
  })

  if (!res.ok) throw await httpError(res)

  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Permintaan PRD gagal')
  if (data.data == null) throw new Error('Respons AI tidak dapat dibaca. Coba lagi.')
  return data.data
}

export async function generateProjectAnalysis(project) {
  return callPrdStage('analyze', project)
}

export async function generateClarificationQuestions(project) {
  return callPrdStage('questions', project)
}

export async function recommendTechnology(project) {
  return callPrdStage('tech', project)
}

export async function generateProductStructure(project) {
  return callPrdStage('structure', project)
}

export async function generatePRD(project) {
  return callPrdStage('prd', project)
}

export async function regeneratePRDSection(project, { sectionTitle, sectionContent, instruction }) {
  return callPrdStage('regenerate', project, { sectionTitle, sectionContent, instruction })
}
