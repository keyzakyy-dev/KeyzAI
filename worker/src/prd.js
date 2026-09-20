/**
 * Pipeline prompt AI PRD Builder. Dipanggil dari route POST /api/prd di
 * worker/src/index.js. Prompt menetap di server: API key tidak pernah ke
 * client, dan UI cukup mengirim stage + objek project.
 *
 * Tahap menerima konteks kumulatif:
 *   analyze    : idea
 *   questions  : idea + analysis
 *   tech       : idea + analysis + QA + mode (auto | manual)
 *   structure  : idea + analysis + QA + tech
 *   prd        : seluruh konteks
 *   regenerate : seluruh konteks + section yang dituju + instruksi user
 *
 * Setiap stage meminta JSON murni; extractPrdJson() menangani model yang
 * membungkusnya dalam fence atau menyertakan teks tambahan.
 */

const LANG_LABELS = { id: 'Bahasa Indonesia', en: 'English' }
const BASE_STYLE = [
  'Kamu adalah asisten product manager senior.',
  'Selalu balas dengan JSON valid saja, tanpa teks di luar JSON, tanpa markdown, tanpa penjelasan.',
  'Jangan mengarang fakta: kalau sebuah detail belum bisa dipastikan dari konteks, tandai status "needs-clarification" (untuk section) atau masukkan ke "assumptions" (untuk analisis).',
]

// Susun pesan untuk upstream OpenAI-compatible: [system, user].
export function buildPrdMessages(stage, project, extra = {}) {
  const lang = LANG_LABELS[project?.language] || LANG_LABELS.id
  const idea = String(project?.projectIdea || '').trim()
  const analysis = project?.aiAnalysis || {}
  const qa = qaLines(project)
  const tech = project?.technologyStack || {}

  const sys = [
    ...BASE_STYLE,
    `Bahasa output (label, pertanyaan, isi PRD): ${lang}.`,
  ]

  const ctx = [
    `IDE PRODUK:\n"""${idea}"""`,
  ]

  switch (stage) {
    case 'analyze':
      return [
        { role: 'system', content: [...sys, 'Tahap: analisis ide. Pahami produk, jangan bertanya.'].join('\n') },
        {
          role: 'user',
          content: [
            ...ctx,
            'Analisis ide ini dan kembalikan JSON dengan bentuk:',
            '{"productType":"","domain":"","problem":"","goals":[],"targetUsers":[],"userRoles":[],"knownRequirements":[],"missingInformation":[],"assumptions":[]}',
            '- productType: jenis produk (mis. Sistem Informasi Akademik, Marketplace, SaaS Dashboard).',
            '- knownRequirements: hal yang SUDAH jelas dari ide (jangan tanyakan lagi nanti).',
            '- missingInformation: hal penting yang BELUM diketahui dan perlu diklarifikasi.',
            '- assumptions: asumsi yang kamu ambil untuk bisa menganalisis (jujur, jangan disembunyikan).',
          ].join('\n'),
        },
      ]

    case 'questions':
      return [
        {
          role: 'system',
          content: [
            ...sys,
            'Tahap: klarifikasi. Buat pertanyaan berdasarkan INFORMATION GAP saja.',
            'ATURAN MUTLAK:',
            '- JANGAN tanyakan hal yang sudah ada di knownRequirements atau ide.',
            '- JANGAN tanyakan "siapa target pengguna" jika sudah tersurat dari ide.',
            '- Jumlah 3-8 pertanyaan; jika ide sudah sangat lengkap, kembalikan array kosong [].',
            '- Urut dari dampak terbesar: scope, user roles, core workflow, business rules, fitur, data, integrasi, keamanan.',
            '- Lebih sedikit pertanyaan bernilai tinggi daripada banyak pertanyaan generik.',
            '- Tipe input bebas: text, textarea, single, multiple, boolean, number, dropdown. Sertakan "options" (2-8) hanya untuk single/multiple/dropdown.',
            '- required:true hanya untuk yang benar-benar mengubah scope produk.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            ...ctx,
            analysisBlock(analysis),
            qa ? `JAWABAN SEMENTARA:\n${qa}` : '',
            'Berdasarkan missingInformation di atas, buat pertanyaan untuk yang BENAR-BENAR belum diketahui.',
            'Kembalikan JSON: {"questions":[{"id":"","question":"","type":"single","options":["A","B"],"placeholder":"","required":false,"help":"alasan singkat mengapa ini penting"}]}',
          ].filter(Boolean).join('\n'),
        },
      ]

    case 'tech':
      return [
        { role: 'system', content: [...sys, 'Tahap: rekomendasi tech stack. Pilih berdasarkan kebutuhan, bukan acak.'].join('\n') },
        {
          role: 'user',
          content: [
            ...ctx,
            analysisBlock(analysis),
            qa ? `JAWABAN KLARIFIKASI:\n${qa}` : '',
            'Rekomendasikan stack untuk produk ini. Tiap key berisi {"name":"","reason":""} alasan singkat spesifik terhadap produk ini.',
            'Kembalikan JSON: {"frontend":{"name":"","reason":""},"backend":{"name":"","reason":""},"database":{"name":"","reason":""},"authentication":{"name":"","reason":""},"deployment":{"name":"","reason":""}}',
          ].filter(Boolean).join('\n'),
        },
      ]

    case 'structure':
      return [
        {
          role: 'system',
          content: [
            ...sys,
            'Tahap: product structure. Struktur harus spesifik untuk produk ini, BUKAN template e-commerce.',
            'Format: Project → Feature → Sub-feature (3-7 fitur, masing-masing 2-5 sub-fitur). Nama pendek, kata benda.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            ...ctx,
            analysisBlock(analysis),
            qa ? `JAWABAN KLARIFIKASI:\n${qa}` : '',
            techBlock(project?.technologySelectionMode, tech),
            'Susun product structure berdasarkan seluruh konteks di atas.',
            'Kembalikan JSON: {"features":[{"id":"f1","name":"Katalog Produk","subFeatures":[{"id":"f1_s1","name":"Search"}]}]}',
          ].filter(Boolean).join('\n'),
        },
      ]

    case 'prd':
      return [
        {
          role: 'system',
          content: [
            ...sys,
            'Tahap: tulis PRD lengkap memakai SELURUH konteks (ide + analisis + jawaban + teknologi + struktur).',
            'Aturan isi:',
            '- Requirement harus konkret, terukur, dapat diuji. Hindari "sistem harus mudah digunakan".',
            '- Functional Requirements pakai ID FR-001, FR-002, ... dengan deskripsi singkat.',
            '- User Stories: "Sebagai [role], saya ingin [action], sehingga [benefit]." Hanya role yang masuk akal dari konteks.',
            '- Acceptance Criteria pakai Given/When/Then.',
            '- Section yang tidak relevan untuk produk ini: JANGAN dipaksakan, lewati saja.',
            '- Requirement yang belum bisa dipastikan: status section "needs-clarification", bukan diarang.',
            '- Tulis ringkas-padat (markdown: heading, list, tabel kecil). Bukan paragraf filler.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            ...ctx,
            analysisBlock(analysis),
            qa ? `JAWABAN KLARIFIKASI:\n${qa}` : '',
            techBlock(project?.technologySelectionMode, tech),
            structureBlock(project?.productStructure),
            'Tulis PRD. Kembalikan JSON: {"sections":[{"id":"sec_1","title":"Product Overview","content":"# ... markdown","status":"ok"}]}',
            'Sertakan section "AI Assumptions" jika ada asumsi, dan "Risks & Considerations".',
          ].filter(Boolean).join('\n'),
        },
      ]

    case 'regenerate':
      return [
        {
          role: 'system',
          content: [
            ...sys,
            'Tahap: regenerate SATU section PRD. Konteks produk tidak boleh bergeser ke produk lain.',
            'Pertahankan istilah, nama fitur, dan role yang sudah mapan di PRD.',
            'Kembalikan HANYA section yang diminta, bentuk {"id":"","title":"","content":"","status":""}.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            ...ctx,
            structureBlock(project?.productStructure),
            `SECTION SAAT INI:\n## ${extra.sectionTitle}\n${extra.sectionContent || ''}`,
            `INSTRUKSI USER: ${extra.instruction || 'Perbaiki dan perjelas section ini.'}`,
            'Tulis ulang section ini mengikuti instruksi, tetap selaras dengan PRD keseluruhan.',
          ].join('\n'),
        },
      ]

    default:
      throw new Error(`Unknown PRD stage: ${stage}`)
  }
}

// Potong konteks ke pasangan Q/A yang ringkas untuk prompt.
function qaLines(project) {
  const qs = project?.questions || []
  const ans = project?.answers || {}
  const lines = qs.map((q) => {
    const a = ans[q.id]
    const val = Array.isArray(a) ? a.join(', ') : a
    return `- ${q.question} → ${val ? String(val).trim() : '(dilewati)'}`
  })
  return lines.join('\n')
}

function analysisBlock(a) {
  if (!a || typeof a !== 'object') return ''
  const parts = []
  if (a.productType) parts.push(`Jenis produk: ${a.productType}`)
  if (a.domain) parts.push(`Domain: ${a.domain}`)
  if (a.problem) parts.push(`Masalah: ${a.problem}`)
  if (a.userRoles?.length) parts.push(`Role: ${a.userRoles.join(', ')}`)
  if (a.targetUsers?.length) parts.push(`Target: ${a.targetUsers.join(', ')}`)
  if (a.knownRequirements?.length) parts.push(`Sudah jelas: ${a.knownRequirements.join('; ')}`)
  if (a.goals?.length) parts.push(`Tujuan: ${a.goals.join('; ')}`)
  if (a.assumptions?.length) parts.push(`Asumsi: ${a.assumptions.join('; ')}`)
  return parts.length ? `ANALISIS:\n${parts.join('\n')}` : ''
}

function techBlock(mode, tech) {
  const lines = []
  for (const [k, v] of Object.entries(tech || {})) {
    if (v) lines.push(`- ${k}: ${typeof v === 'string' ? v : v?.name}`)
  }
  if (!lines.length) return ''
  return `${mode === 'manual' ? 'PILIHAN USER' : 'STACK'}:\n${lines.join('\n')}`
}

function structureBlock(s) {
  const feats = s?.features || []
  if (!feats.length) return ''
  const lines = feats.map((f) => {
    const subs = (f.subFeatures || []).map((sf) => `    - ${sf.name}`).join('\n')
    return `- ${f.name}\n${subs}`
  })
  return `PRODUCT STRUCTURE:\n${lines.join('\n')}`
}

/**
 * Ekstrak JSON dari jawaban model. Model kadang membungkus dengan fence
 * ```json atau menambahkan teks — cari objek JSON seimbang pertama.
 */
export function extractPrdJson(text) {
  if (text == null) return null
  let t = String(text).trim()

  // buang fenced block ```json ... ``` (tutup di akhir)
  const fence = /^```[a-zA-Z]*\s*\n?([\s\S]*?)\n?```\s*$/.exec(t)
  if (fence) t = fence[1].trim()

  try {
    return JSON.parse(t)
  } catch {
    // lanjut ke brace matching
  }

  const start = t.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inStr = false
  let escape = false
  for (let i = start; i < t.length; i++) {
    const ch = t[i]
    if (inStr) {
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === '"') inStr = false
    } else if (ch === '"') inStr = true
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        const candidate = t.slice(start, i + 1)
        try {
          return JSON.parse(candidate)
        } catch {
          return null
        }
      }
    }
  }
  return null
}

// Validasi stage yang diterima dari client (trust boundary).
export const PRD_STAGES = ['analyze', 'questions', 'tech', 'structure', 'prd', 'regenerate']

export function isValidPrdStage(stage) {
  return PRD_STAGES.includes(stage)
}
