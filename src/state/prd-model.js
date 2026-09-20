/**
 * Model data PRD Builder. Satu objek project mengalir lewat seluruh tahap;
 * AI service menerima dan mengembalikan bagian-bagian objek ini.
 *
 * project = {
 *   id, projectName, projectIdea, language,
 *   technologySelectionMode: 'auto' | 'manual',
 *   technologyStack: { frontend, backend, database, authentication, deployment },
 *   aiAnalysis: { problem, goals, targetUsers, userRoles, knownRequirements,
 *                 missingInformation, assumptions, productType, domain },
 *   questions: [{ id, question, type, options, placeholder, required, help }],
 *   answers:   { [questionId]: string | string[] },
 *   productStructure: { features: [{ id, name, subFeatures: [{ id, name }] }] },
 *   prd: { sections: [{ id, title, content, status }] },
 *   step, createdAt, updatedAt
 * }
 *
 * Tidak ada PRD hardcode: struktur & isi dihasilkan AI dari konteks project.
 */

export const PRD_STEPS = ['idea', 'clarify', 'tech', 'structure', 'prd']
export const STEP_LABELS = {
  idea: 'Ide',
  clarify: 'Pertanyaan',
  tech: 'Teknologi',
  structure: 'Struktur',
  prd: 'PRD',
}

export const QUESTION_TYPES = [
  'text',
  'textarea',
  'single',
  'multiple',
  'boolean',
  'number',
  'dropdown',
]

// Status section: 'ok' | 'needs-clarification'. Yang belum pasti ditandai,
// bukan diarang — lihat "Uncertainty" di PRD instruction.
export const SECTION_STATUS = { OK: 'ok', NEEDS: 'needs-clarification' }

// Kandidat section PRD; AI boleh melepas yang tidak relevan (lihat prd.js).
export const PRD_SECTION_CANDIDATES = [
  'Product Overview',
  'Problem Statement',
  'Background',
  'Target Users',
  'User Roles',
  'User Personas',
  'Product Goals',
  'Success Metrics',
  'Product Scope',
  'Out of Scope',
  'Core User Journey',
  'User Stories',
  'Product Features',
  'Functional Requirements',
  'Business Rules',
  'Non-Functional Requirements',
  'UI/UX Requirements',
  'Authentication & Authorization',
  'Data Requirements',
  'Database Requirements',
  'API / Integration Requirements',
  'Security Requirements',
  'Error & Edge Cases',
  'Acceptance Criteria',
  'Technology Stack',
  'Development Milestones',
  'Risks & Considerations',
]

export const TECH_KEYS = ['frontend', 'backend', 'database', 'authentication', 'deployment']

export function emptyTechStack() {
  return { frontend: '', backend: '', database: '', authentication: '', deployment: '' }
}

export function createEmptyProject(id, { language = 'id' } = {}) {
  const now = Date.now()
  return {
    id,
    projectName: '',
    projectIdea: '',
    language,
    technologySelectionMode: 'auto',
    technologyStack: emptyTechStack(),
    aiAnalysis: {
      productType: '',
      domain: '',
      problem: '',
      goals: [],
      targetUsers: [],
      userRoles: [],
      knownRequirements: [],
      missingInformation: [],
      assumptions: [],
    },
    questions: [],
    answers: {},
    productStructure: { features: [] },
    prd: { sections: [] },
    step: 'idea',
    createdAt: now,
    updatedAt: now,
  }
}

// Nama project dari ide: kalimat pertama yang berisi, potong 60 char.
export function deriveProjectName(idea) {
  const t = String(idea || '').trim()
  if (!t) return 'PRD Tanpa Nama'
  const first = t.split(/[.\n]/)[0].trim()
  return (first.length > 60 ? first.slice(0, 60) + '…' : first) || 'PRD Tanpa Nama'
}

// Validasi input ide di client sebelum panggil AI (worker memvalidasi lagi).
export function validateIdea(idea) {
  const t = String(idea || '').trim()
  if (t.length < 3) return 'Ceritakan ide kamu minimal beberapa kata.'
  if (t.length > 4000) return 'Ide terlalu panjang (maks 4000 karakter).'
  return null
}

// --- normalisasi struktur keluaran AI -------------------------------------

function cleanStr(v, max = 4000) {
  const t = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : ''
  return t.slice(0, max)
}

// Pertanyaan dari AI: field asing dibuang, opsi dibatasi, tipe diseragamkan.
export function normalizeQuestion(raw, index) {
  if (!raw || typeof raw !== 'object') return null
  const type = QUESTION_TYPES.includes(raw.type) ? raw.type : 'text'
  const question = cleanStr(raw.question ?? raw.title ?? raw.label, 300)
  if (!question) return null

  let options = []
  if (Array.isArray(raw.options)) {
    const seen = new Set()
    for (const o of raw.options) {
      const label = cleanStr(typeof o === 'string' ? o : o?.label, 120)
      if (!label || seen.has(label.toLowerCase())) continue
      seen.add(label.toLowerCase())
      options.push(label)
      if (options.length >= 8) break
    }
  }

  // single/dropdown/multiple tanpa opsi tidak bisa dirender — turun ke text.
  const needsOptions = type === 'single' || type === 'multiple' || type === 'dropdown'
  const finalType = needsOptions && options.length < 2 ? 'text' : type

  return {
    id: cleanStr(raw.id, 40) || `q${index + 1}`,
    question,
    type: finalType,
    options,
    placeholder: cleanStr(raw.placeholder, 120),
    required: raw.required === true,
    help: cleanStr(raw.help, 240),
  }
}

export function normalizeQuestions(list, max = 8) {
  if (!Array.isArray(list)) return []
  const out = []
  const seen = new Set()
  for (let i = 0; i < list.length && out.length < max; i++) {
    const q = normalizeQuestion(list[i], i)
    if (!q) continue
    if (seen.has(q.question.toLowerCase())) continue // duplikat dibuang
    seen.add(q.question.toLowerCase())
    out.push(q)
  }
  return out
}

// Jawaban selalu string atau array string (multiple). Null = belum dijawab.
export function normalizeAnswer(value) {
  if (value == null) return null
  if (Array.isArray(value)) {
    const arr = value.map((v) => String(v)).filter((v) => v.trim())
    return arr.length ? arr : null
  }
  const t = String(value).trim()
  return t ? t : null
}

// Struktur produk: feature → subFeatures. Id stabil dipakai UI untuk edit.
export function normalizeStructure(raw) {
  if (!raw || typeof raw !== 'object') return { features: [] }
  const features = Array.isArray(raw.features) ? raw.features : []
  const seenF = new Set()
  const out = features
    .map((f, i) => {
      if (!f || typeof f !== 'object') return null
      const name = cleanStr(f.name ?? f.title, 80)
      if (!name) return null
      const id = String(f.id || `f${i + 1}`)
      if (seenF.has(id)) return null
      seenF.add(id)
      const subs = (Array.isArray(f.subFeatures) ? f.subFeatures : [])
        .map((s, j) => {
          const sname = cleanStr(typeof s === 'string' ? s : s?.name ?? s?.title, 80)
          if (!sname) return null
          return { id: String(s?.id || `${id}_s${j + 1}`), name: sname }
        })
        .filter(Boolean)
      return { id, name, subFeatures: subs }
    })
    .filter(Boolean)
  return { features: out }
}

export function normalizeTechStack(raw) {
  const out = emptyTechStack()
  if (!raw || typeof raw !== 'object') return out
  for (const k of TECH_KEYS) {
    const v = raw[k]
    out[k] = cleanStr(typeof v === 'string' ? v : v?.name ?? v?.technology, 80)
  }
  return out
}

// Section PRD: konten wajib; status dipakai untuk penanda "belum ditentukan".
export function normalizeSection(raw, index) {
  if (!raw || typeof raw !== 'object') return null
  const title = cleanStr(raw.title ?? raw.heading ?? raw.name, 120)
  const content = typeof raw.content === 'string' ? raw.content.trim() : ''
  if (!title || !content) return null
  const status = raw.status === SECTION_STATUS.NEEDS ? SECTION_STATUS.NEEDS : SECTION_STATUS.OK
  return {
    id: cleanStr(raw.id, 60) || `sec_${index + 1}`,
    title,
    content,
    status,
  }
}

export function normalizeSections(list) {
  if (!Array.isArray(list)) return []
  const out = []
  const seen = new Set()
  for (let i = 0; i < list.length; i++) {
    const s = normalizeSection(list[i], i)
    if (!s) continue
    const key = s.title.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(s)
  }
  return out
}

export function normalizeAnalysis(raw) {
  const arr = (v) => (Array.isArray(v) ? v.map((x) => cleanStr(x, 300)).filter(Boolean) : [])
  return {
    productType: cleanStr(raw?.productType, 120),
    domain: cleanStr(raw?.domain, 120),
    problem: cleanStr(raw?.problem, 600),
    goals: arr(raw?.goals),
    targetUsers: arr(raw?.targetUsers),
    userRoles: arr(raw?.userRoles),
    knownRequirements: arr(raw?.knownRequirements),
    missingInformation: arr(raw?.missingInformation),
    assumptions: arr(raw?.assumptions),
  }
}

// Bentuk jawaban siap dikirim ke prompt tahap berikutnya: pasangan Q&A yang
// sudah dibersihkan (skip → dikosongkan, AI pakai info yang ada).
export function collectQAPairs(project) {
  const questions = project?.questions || []
  const answers = project?.answers || {}
  return questions.map((q) => {
    const a = normalizeAnswer(answers[q.id])
    return {
      question: q.question,
      type: q.type,
      answer: Array.isArray(a) ? a.join(', ') : a || '',
      skipped: !a,
    }
  })
}

// Apakah ada pertanyaan penting yang belum dijawab (untuk saran di UI).
export function unansweredImportant(project) {
  const answers = project?.answers || {}
  return (project?.questions || []).filter((q) => q.required && !normalizeAnswer(answers[q.id]))
}
