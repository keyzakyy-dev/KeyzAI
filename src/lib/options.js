/**
 * Parser untuk blok opsi interaktif (`keyzai-options`) yang dikirim model.
 *
 * Protokolnya bebas provider: model hanya perlu menulis fenced block berisi JSON,
 * lalu frontend (src/components/OptionCard.jsx) yang me-render jadi kartu pilihan.
 * Semua nilai divalidasi + dibatasi di sini supaya payload aneh dari model tidak
 * pernah sampai ke UI. Lihat SYSTEM_PROMPT di worker/src/index.js untuk kontraknya.
 */

export const OPTIONS_LANG = 'keyzai-options'
export const SKIP_LABEL = 'Lewati'

const MAX_QUESTIONS = 5
const MAX_OPTIONS = 8
const MIN_OPTIONS = 2
const MAX_QUESTION_CHARS = 300
const MAX_LABEL_CHARS = 120
const MAX_DESC_CHARS = 160

/**
 * Cocokkan tag bahasa fence. 'partial' dipakai saat fence masih ter-stream
 * sebagian (mis. "keyzai-opt") agar UI bisa menampilkan skeleton, bukan JSON mentah.
 */
export function optionsLangState(lang) {
  const l = String(lang || '').toLowerCase()
  if (l === OPTIONS_LANG || l === 'options') return 'exact'
  if (l.length >= 4 && OPTIONS_LANG.startsWith(l)) return 'partial'
  return false
}

function clean(value, max) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

function parseOptions(list) {
  if (!Array.isArray(list)) return []
  const out = []
  const seen = new Set()
  for (const raw of list) {
    // opsi boleh string pendek ("Produk digital") atau object { label, description }
    const label = clean(typeof raw === 'string' ? raw : raw?.label, MAX_LABEL_CHARS)
    if (!label || seen.has(label.toLowerCase())) continue
    seen.add(label.toLowerCase())
    const description = clean(typeof raw === 'object' ? raw?.description : '', MAX_DESC_CHARS)
    out.push(description ? { label, description } : { label })
    if (out.length >= MAX_OPTIONS) break
  }
  return out
}

function parseQuestion(raw, index) {
  if (!raw || typeof raw !== 'object') return null
  const question = clean(raw.question ?? raw.title, MAX_QUESTION_CHARS)
  const options = parseOptions(raw.options ?? raw.choices)
  if (!question || options.length < MIN_OPTIONS) return null
  return {
    id: clean(raw.id, 40) || `q${index + 1}`,
    question,
    options,
    multiple: raw.multiple === true,
  }
}

/**
 * Terima isi JSON mentah dari dalam fence `keyzai-options`.
 * Bentuk yang didukung: { questions: [...] } atau satu pertanyaan tunggal { ... }.
 * Mengembalikan null bila tidak layak dirender (caller menampilkan fallback).
 */
export function parseOptionsPayload(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null

  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (Array.isArray(data)) data = { questions: data }
  if (!data || typeof data !== 'object') return null

  const list = Array.isArray(data.questions) ? data.questions : [data]
  const questions = list.slice(0, MAX_QUESTIONS).map(parseQuestion).filter(Boolean)
  if (questions.length === 0) return null

  return { questions }
}

/**
 * Rangkai jawaban jadi pesan user yang enak dibaca model.
 * Satu jawaban dikirim apa adanya (natural); banyak jawaban jadi daftar berlabel.
 */
export function formatAnswers(pairs) {
  const list = (Array.isArray(pairs) ? pairs : []).filter((p) => p && p.label)
  if (list.length === 0) return ''
  if (list.length === 1) return list[0].label
  return [
    'Jawaban saya:',
    ...list.map((p) => `- ${p.question ? `${p.question} → ` : ''}${p.label}`),
  ].join('\n')
}