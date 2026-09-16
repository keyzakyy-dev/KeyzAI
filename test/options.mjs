// Self-check parser blok opsi interaktif: node test/options.mjs
import assert from 'node:assert/strict'
import {
  OPTIONS_LANG,
  SKIP_LABEL,
  formatAnswers,
  optionsLangState,
  parseOptionsPayload,
} from '../src/lib/options.js'

const q = (question, options, extra = {}) => JSON.stringify({ question, options, ...extra })

// --- tag bahasa fence
assert.equal(optionsLangState(OPTIONS_LANG), 'exact', 'tag resmi')
assert.equal(optionsLangState('OPTIONS'), 'exact', 'alias options')
assert.equal(optionsLangState('Keyzai-Options'), 'exact', 'case-insensitive')
assert.equal(optionsLangState('keyzai-opt'), 'partial', 'fence setengah ter-stream')
assert.equal(optionsLangState('keyz'), 'partial', 'fence awal ter-stream')
assert.equal(optionsLangState('js'), false, 'bahasa lain bukan blok opsi')
assert.equal(optionsLangState(''), false, 'tanpa tag')

// --- bentuk pertanyaan tunggal (opsi string)
const single = parseOptionsPayload(
  q('Toko ini jual apa / model bisnisnya seperti apa?', [
    'Produk fisik (retail/UMKM)',
    'Produk digital (ebook, kursus, dll)',
  ])
)
assert.equal(single.questions.length, 1, 'satu pertanyaan')
assert.equal(single.questions[0].id, 'q1', 'id fallback')
assert.equal(single.questions[0].options.length, 2, 'dua opsi')
assert.equal(single.questions[0].multiple, false, 'default single choice')
assert.equal(single.questions[0].options[0].description, undefined, 'tanpa description')

// --- bentuk { questions: [...] } + description + multiple + array shorthand
const rich = parseOptionsPayload(
  JSON.stringify({
    questions: [
      { id: 'model', question: 'Model bisnisnya?', options: [{ label: 'Retail', description: 'toko fisik' }, { label: 'Digital' }], multiple: true },
      { question: 'Target pasar?', options: ['UMKM', 'Korporat'] },
    ],
  })
)
assert.equal(rich.questions.length, 2, 'dua pertanyaan')
assert.equal(rich.questions[0].multiple, true, 'multiple diteruskan')
assert.equal(rich.questions[0].options[0].description, 'toko fisik', 'description dipertahankan')
assert.equal(rich.questions[1].id, 'q2', 'id fallback per index')

const arrayForm = parseOptionsPayload(JSON.stringify([{ question: 'Q?', options: ['A', 'B'] }]))
assert.equal(arrayForm.questions.length, 1, 'array dianggap daftar pertanyaan')

// --- payload tidak layak dirender
assert.equal(parseOptionsPayload(''), null, 'teks kosong')
assert.equal(parseOptionsPayload('bukan json'), null, 'JSON rusak (fallback ke code block)')
assert.equal(parseOptionsPayload('{}'), null, 'objek tanpa pertanyaan')
assert.equal(parseOptionsPayload(null), null, 'bukan string')
assert.equal(parseOptionsPayload(q('Q?', ['hanya satu'])), null, 'minimal dua opsi')
assert.equal(parseOptionsPayload(q('   ', ['A', 'B'])), null, 'pertanyaan kosong')

// --- batas ukuran
const manyOptions = parseOptionsPayload(q('Q?', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']))
assert.equal(manyOptions.questions[0].options.length, 8, 'opsi dipotong ke 8')
const manyQuestions = parseOptionsPayload(
  JSON.stringify({ questions: Array.from({ length: 8 }, (_, n) => ({ question: `Q${n}?`, options: ['A', 'B'] })) })
)
assert.equal(manyQuestions.questions.length, 5, 'pertanyaan dipotong ke 5')

// --- label duplikat & label terlalu panjang dibersihkan
const cleaned = parseOptionsPayload(q('Q?   dengan   spasi', ['Retail', 'retail', 'y'.repeat(400)]))
assert.equal(cleaned.questions[0].question, 'Q? dengan spasi', 'spasi dirapikan')
assert.equal(cleaned.questions[0].options.length, 2, 'label kembar dibuang')
assert.equal(cleaned.questions[0].options[1].label.length, 120, 'label dipotong ke 120')

// --- formatAnswers
assert.equal(formatAnswers([{ question: 'Q?', label: 'Retail' }]), 'Retail', 'satu jawaban dikirim apa adanya')
assert.equal(formatAnswers([]), '', 'tanpa jawaban')
assert.equal(formatAnswers(null), '', 'input null')
assert.equal(
  formatAnswers([
    { id: 'a', question: 'Model bisnis?', label: 'Retail' },
    { id: 'b', question: 'Target pasar?', label: SKIP_LABEL },
  ]),
  'Jawaban saya:\n- Model bisnis? → Retail\n- Target pasar? → Lewati',
  'banyak jawaban jadi daftar berlabel'
)

console.log('options parser: OK')