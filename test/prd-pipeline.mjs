// Self-check pipeline prompt + parser JSON PRD: node test/prd-pipeline.mjs
import assert from 'node:assert/strict'
import { buildPrdMessages, extractPrdJson, isValidPrdStage } from '../worker/src/prd.js'

// ---------- stage valid
assert.equal(isValidPrdStage('analyze'), true)
assert.equal(isValidPrdStage('prd'), true)
assert.equal(isValidPrdStage('regenerate'), true)
assert.equal(isValidPrdStage('hack'), false)

// ---------- bentuk pesan per stage: system + user, konteks kumulatif
const project = {
  projectIdea: 'Aplikasi absensi mahasiswa QR Code',
  language: 'id',
  aiAnalysis: {
    productType: 'Academic Attendance System',
    userRoles: ['Mahasiswa', 'Dosen'],
    knownRequirements: ['QR Code', 'absensi'],
    assumptions: ['satu institusi'],
  },
  questions: [{ id: 'q1', question: 'Siapa buat QR?', type: 'single' }],
  answers: { q1: 'Dosen' },
  technologySelectionMode: 'auto',
  technologyStack: { frontend: 'React', backend: 'Node.js' },
  productStructure: { features: [{ id: 'f1', name: 'Absensi', subFeatures: [{ id: 'f1_s1', name: 'Scan QR' }] }] },
}

for (const stage of ['analyze', 'questions', 'tech', 'structure', 'prd']) {
  const msgs = buildPrdMessages(stage, project)
  assert.equal(msgs.length, 2, `${stage}: [system, user]`)
  assert.equal(msgs[0].role, 'system')
  assert.equal(msgs[1].role, 'user')
  assert.ok(msgs[0].content.includes('JSON valid'), `${stage}: sistem wajib JSON`)
}

// konteks kumulatif: prd memuat ide + jawaban + stack + struktur
const prdMsgs = buildPrdMessages('prd', project)
assert.ok(prdMsgs[1].content.includes('Aplikasi absensi mahasiswa QR Code'), 'prd memuat ide')
assert.ok(prdMsgs[1].content.includes('Dosen'), 'prd memuat jawaban klarifikasi')
assert.ok(prdMsgs[1].content.includes('React'), 'prd memuat tech stack')
assert.ok(prdMsgs[1].content.includes('Scan QR'), 'prd memuat sub-fitur')

// questions TIDAK boleh memuat info yang sudah known (aturan prompt)
const qMsgs = buildPrdMessages('questions', project)
assert.ok(qMsgs[0].content.includes('JANGAN'), 'questions punya aturan information gap')
assert.ok(qMsgs[0].content.includes('3-8'), 'batas jumlah pertanyaan ada di prompt')

// regenerate memakai instruksi + section lama
const regen = buildPrdMessages('regenerate', project, {
  sectionTitle: 'Functional Requirements',
  sectionContent: 'FR-001 ...',
  instruction: 'Tambahkan requirement untuk admin',
})
assert.ok(regen[1].content.includes('Tambahkan requirement untuk admin'), 'instruksi user ikut')
assert.ok(regen[1].content.includes('FR-001'), 'section lama ikut')
assert.equal(regen[0].content.includes('SATU section'), true, 'hanya satu section')

// stage asing ditolak
assert.throws(() => buildPrdMessages('unknown', project), /Unknown PRD stage/)

// ---------- extractPrdJson: variasi output model
assert.deepEqual(extractPrdJson('{"a":1}'), { a: 1 }, 'JSON murni')
assert.deepEqual(extractPrdJson('```json\n{"a":1}\n```'), { a: 1 }, 'JSON dalam fence')
assert.deepEqual(extractPrdJson('```{"a":1}```'), { a: 1 }, 'fence tanpa label')
assert.deepEqual(extractPrdJson('Berikut hasilnya:\n{"a":1,"b":{"c":[1,2]}}\nTerima kasih.'), {
  a: 1,
  b: { c: [1, 2] },
}, 'JSON dengan teks di sekitar')
assert.deepEqual(extractPrdJson('{"a":{"b":"c"}} dan {"d":1}'), { a: { b: 'c' } }, 'objek pertama yang diambil')
assert.equal(extractPrdJson('bukan json sama sekali'), null, 'teks biasa → null')
assert.equal(extractPrdJson('{"a":'), null, 'JSON terpotong → null')
assert.equal(extractPrdJson(null), null, 'input null')
// string di dalam JSON tidak boleh menipu brace matcher
assert.deepEqual(extractPrdJson('{"text":"}" }'), { text: '}' }, 'brace di dalam string aman')

console.log('prd pipeline: OK')
