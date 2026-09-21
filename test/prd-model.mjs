// Self-check model PRD Builder: node test/prd-model.mjs
import assert from 'node:assert/strict'
import {
  PRD_STEPS,
  QUESTION_TYPES,
  SECTION_STATUS,
  TECH_KEYS,
  emptyTechStack,
  createEmptyProject,
  deriveProjectName,
  furthestStepIndex,
  validateIdea,
  normalizeQuestion,
  normalizeQuestions,
  normalizeAnswer,
  normalizeStructure,
  normalizeTechStack,
  normalizeSection,
  normalizeSections,
  normalizeAnalysis,
  collectQAPairs,
  unansweredImportant,
} from '../src/state/prd-model.js'
import { freshPrdState, loadPrdState, savePrdState, loadProject, removeProject } from '../src/state/prd-persistence.js'

// ---------- empty project shape
const p = createEmptyProject('prd_1', { language: 'en' })
assert.equal(p.id, 'prd_1')
assert.equal(p.language, 'en')
assert.equal(p.step, 'idea')
assert.equal(p.technologySelectionMode, 'auto')
assert.deepEqual(p.productStructure.features, [])
assert.deepEqual(p.prd.sections, [])
assert.equal(TECH_KEYS.length, 5)
assert.ok(PRD_STEPS.includes('clarify') && PRD_STEPS.length === 5)

// ---------- nama project dari ide
assert.equal(deriveProjectName('Buat aplikasi absensi mahasiswa'), 'Buat aplikasi absensi mahasiswa')
assert.ok(deriveProjectName('x'.repeat(200)).endsWith('…'))
assert.equal(deriveProjectName(''), 'PRD Tanpa Nama')

// ---------- validasi ide
assert.ok(validateIdea(''))
assert.ok(validateIdea('ab'))
assert.equal(validateIdea('Saya ingin membuat aplikasi absensi QR Code'), null)
assert.ok(validateIdea('x'.repeat(4001)))

// ---------- normalisasi pertanyaan: tipe asing & duplikat dibersihkan
const qs = normalizeQuestions([
  { id: 'q1', question: 'Siapa yang membuat QR?', type: 'single', options: ['Dosen', 'Admin'] },
  { id: 'q2', question: '   ', type: 'text' }, // pertanyaan kosong dibuang
  { question: 'Apakah validasi lokasi?', type: 'boolean' },
  { id: 'q3', question: 'Tipe asing', type: 'slider' }, // turun ke text
  { id: 'q4', question: 'Opsi kurang', type: 'single', options: ['satu'] }, // turun ke text
  { question: 'Siapa yang membuat QR?', type: 'single', options: ['Dosen', 'Admin'] }, // duplikat dibuang
])
assert.equal(qs.length, 4, 'pertanyaan valid tersisa 4')
assert.equal(qs[0].id, 'q1')
assert.equal(qs[2].type, 'text', 'tipe asing jadi text')
assert.equal(qs[3].type, 'text', 'single tanpa opsi jadi text')
assert.ok(QUESTION_TYPES.includes('dropdown'))

// batas atas pertanyaan
const many = normalizeQuestions(Array.from({ length: 12 }, (_, i) => ({ id: `m${i}`, question: `Q${i}?`, type: 'text' })))
assert.equal(many.length, 8, 'maks 8 pertanyaan')

// opsi maksimal 8 & label panjang dipotong (label harus berbeda setelah dipotong)
const big = normalizeQuestion({ id: 'b1', question: 'Pilih?', type: 'multiple', options: Array.from({ length: 12 }, (_, i) => `Opsi ${i} ` + 'x'.repeat(200)) })
assert.equal(big.options.length, 8)
assert.ok(big.options.every((o) => o.length <= 120))
assert.ok(new Set(big.options).size === 8, 'label hasil potong tetap unik')

// ---------- jawaban
assert.equal(normalizeAnswer('  Dosen  '), 'Dosen')
assert.equal(normalizeAnswer(''), null)
assert.deepEqual(normalizeAnswer(['Dosen', 'Admin']), ['Dosen', 'Admin'])
assert.equal(normalizeAnswer(['', '  ']), null)

// ---------- struktur produk
const st = normalizeStructure({
  features: [
    { id: 'f1', name: 'Absensi', subFeatures: [{ id: 'f1_s1', name: 'Scan QR' }, { name: 'Rekap' }] },
    { id: 'f2', name: '   ' }, // nama kosong dibuang
    { name: 'Laporan', subFeatures: 'bukan-array' },
  ],
})
assert.equal(st.features.length, 2)
assert.equal(st.features[0].subFeatures.length, 2)
assert.equal(st.features[1].name, 'Laporan')
assert.equal(normalizeStructure(null).features.length, 0)

// ---------- tech stack
const tech = normalizeTechStack({ frontend: { name: 'React' }, backend: 'Node.js', database: null })
assert.equal(tech.frontend, 'React')
assert.equal(tech.backend, 'Node.js')
assert.equal(tech.database, '')
assert.equal(tech.authentication, '')

// ---------- section PRD
const secs = normalizeSections([
  { id: 's1', title: 'Product Overview', content: '# Overview\nDeskripsi', status: 'ok' },
  { title: 'Functional Requirements', content: 'FR-001 ...' },
  { title: 'Product Overview', content: 'duplikat judul dibuang' }, // duplikat dibuang
  { title: '', content: 'tanpa judul' }, // dibuang
  { title: 'Tanpa konten', content: '   ' }, // dibuang
])
assert.equal(secs.length, 2)
assert.equal(secs[1].status, SECTION_STATUS.OK, 'status default ok')
const needs = normalizeSection({ title: 'Risiko', content: 'belum pasti', status: 'needs-clarification' })
assert.equal(needs.status, SECTION_STATUS.NEEDS)

// ---------- analisis
const an = normalizeAnalysis({
  productType: 'Sistem Absensi',
  userRoles: ['Mahasiswa', 'Dosen'],
  goals: ['akurasi kehadiran'],
  assumptions: ['satu kampus'],
  missingInformation: ['aturan keterlambatan'],
})
assert.equal(an.productType, 'Sistem Absensi')
assert.deepEqual(an.userRoles, ['Mahasiswa', 'Dosen'])

// ---------- QA pairs: lewati vs dijawab
const proj = {
  ...p,
  questions: [
    { id: 'q1', question: 'Siapa buat QR?', type: 'single' },
    { id: 'q2', question: 'Validasi lokasi?', type: 'boolean' },
  ],
  answers: { q1: 'Dosen', q2: null },
}
const qa = collectQAPairs(proj)
assert.equal(qa.length, 2)
assert.equal(qa[0].answer, 'Dosen')
assert.equal(qa[0].skipped, false)
assert.equal(qa[1].skipped, true, 'jawaban null = dilewati')

// pertanyaan required yang belum dijawab terdeteksi
const important = unansweredImportant({ ...proj, questions: [...proj.questions, { id: 'q3', question: 'Waktu valid QR?', type: 'text', required: true }] })
assert.equal(important.length, 1, 'hanya q3 (required) yang belum dijawab')
assert.equal(important[0].id, 'q3')

// ---------- tahap terjauh yang punya data (dasar lompatan stepper)
assert.equal(furthestStepIndex(p), 0, 'project segar = tahap ide')
assert.equal(furthestStepIndex(null), 0)
assert.equal(furthestStepIndex({ ...p, step: 'prd' }), 0, 'step saja tidak dihitung — data yang dihitung')
assert.equal(furthestStepIndex({ ...p, questions: [{ id: 'q1', question: 'Q?', type: 'text' }] }), 1)
assert.equal(furthestStepIndex({ ...p, technologySelectionMode: 'manual', technologyStack: emptyTechStack() }), 2)
assert.equal(furthestStepIndex({ ...p, technologyStack: { ...emptyTechStack(), frontend: 'React' } }), 2)
assert.equal(furthestStepIndex({ ...p, productStructure: { features: [{ id: 'f1', name: 'F', subFeatures: [] }] } }), 3)
const full = { ...p, prd: { sections: [{ id: 's1', title: 'Overview', content: 'isi', status: 'ok' }] } }
assert.equal(furthestStepIndex(full), 4, 'PRD sudah dibuat = tahap 5 tetap tercapai walau step mundur ke ide')

// ---------- persistence: round-trip & data rusak
const mem = new Map()
const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) }
assert.deepEqual(loadPrdState(storage), freshPrdState(), 'storage kosong = state segar')

const saved = { ...p, projectIdea: 'Aplikasi absensi QR Code', step: 'clarify' }
mem.set('keyzai-prd', JSON.stringify({ v: 1, projects: { [saved.id]: saved }, activeId: saved.id }))
let loaded = loadPrdState(storage)
assert.equal(loaded.projects[saved.id].projectIdea, 'Aplikasi absensi QR Code')
assert.equal(loaded.activeId, null, 'activeId tidak dipulihkan — mulai project baru')

// project tanpa ide tidak ikut dimuat
mem.set('keyzai-prd', JSON.stringify({ v: 1, projects: { bad: { id: 'bad' } }, activeId: null }))
assert.equal(loadPrdState(storage).projects.bad, undefined, 'project tanpa ide dibuang')

// JSON rusak / versi tak dikenal
mem.set('keyzai-prd', '{bukan json')
assert.deepEqual(loadPrdState(storage), freshPrdState())
mem.set('keyzai-prd', JSON.stringify({ v: 99, projects: {} }))
assert.deepEqual(loadPrdState(storage), freshPrdState(), 'versi masa depan tidak dimuat')

// loadProject + removeProject
mem.set('keyzai-prd', JSON.stringify({ v: 1, projects: { [saved.id]: saved }, activeId: null }))
assert.equal(loadProject(saved.id, storage)?.id, saved.id)
assert.equal(loadProject('tidak-ada', storage), null)
removeProject(saved.id, storage)
assert.equal(loadProject(saved.id, storage), null)

// save error dilaporkan, bukan ditelan
assert.ok(savePrdState(freshPrdState(), { setItem: () => { throw new Error('quota') } }) instanceof Error)

console.log('prd model + persistence: OK')
