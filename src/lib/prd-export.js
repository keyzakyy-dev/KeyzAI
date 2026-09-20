/**
 * Export service PRD Builder.
 *
 * Markdown + JSON adalah implementasi penuh (zero dependency, pola sama
 * dengan lib/backup.js). PDF/DOCX adalah abstraction — saat ini redirect ke
 * markdown file; sambungkan library export nanti tanpa mengubah UI.
 * ponytail: PDF/DOCX butuh render library; upgrade = ganti stub ini.
 */

import { STEP_LABELS } from '../state/prd-model'

function stamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
}

function download(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function slugify(text) {
  return String(text || 'prd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'prd'
}

/**
 * Rangkai project jadi satu dokumen markdown. Urutan: judul, meta, asumsi
 * AI, lalu section PRD yang sudah diurutkan seperti penyimpanan editor.
 */
export function projectToMarkdown(project) {
  if (!project) return ''
  const lines = []
  const name = project.projectName || 'Product Requirements Document'

  lines.push(`# ${name}`, '')

  const meta = [
    project.aiAnalysis?.productType && `**Jenis produk:** ${project.aiAnalysis.productType}`,
    project.aiAnalysis?.domain && `**Domain:** ${project.aiAnalysis.domain}`,
    project.aiAnalysis?.userRoles?.length && `**User roles:** ${project.aiAnalysis.userRoles.join(', ')}`,
  ].filter(Boolean)
  if (meta.length) lines.push(meta.join('  \n'), '')

  if (project.projectIdea) {
    lines.push('## Ide Awal', '', project.projectIdea.trim(), '')
  }

  if (project.questions?.length) {
    lines.push('## Klarifikasi', '')
    project.questions.forEach((q) => {
      const a = project.answers?.[q.id]
      const val = Array.isArray(a) ? a.join(', ') : a
      lines.push(`**${q.question}**  `, val ? val : '*(dilewati)*', '')
    })
  }

  const stack = project.technologyStack || {}
  const stackLines = Object.entries(stack)
    .filter(([, v]) => v)
    .map(([k, v]) => `- **${k}:** ${typeof v === 'string' ? v : v?.name}`)
  if (stackLines.length) lines.push('## Technology Stack', '', stackLines.join('\n'), '')

  if (project.productStructure?.features?.length) {
    lines.push('## Product Structure', '')
    project.productStructure.features.forEach((f) => {
      lines.push(`- **${f.name}**`)
      ;(f.subFeatures || []).forEach((sf) => lines.push(`  - ${sf.name}`))
    })
    lines.push('')
  }

  const assumptions = project.aiAnalysis?.assumptions
  if (assumptions?.length) {
    lines.push('## AI Assumptions', '')
    assumptions.forEach((a) => lines.push(`- ${a}`))
    lines.push('')
  }

  if (project.prd?.sections?.length) {
    lines.push('---', '')
    project.prd.sections.forEach((s) => {
      lines.push(s.content.trim(), '')
    })
  }

  return lines.join('\n')
}

export function projectToJSON(project) {
  if (!project) return ''
  const { model, ...rest } = project
  return JSON.stringify(rest, null, 2)
}

export function exportMarkdown(project) {
  const md = projectToMarkdown(project)
  if (!md.trim()) return false
  download(`prd-${slugify(project.projectName)}-${stamp()}.md`, md, 'text/markdown')
  return true
}

export function exportJSON(project) {
  const json = projectToJSON(project)
  if (!json.trim()) return false
  download(`prd-${slugify(project.projectName)}-${stamp()}.json`, json, 'application/json')
  return true
}

/**
 * Abstraction untuk PDF/DOCX. Implementasi saat ini memakai markdown sebagai
 * output sehingga tidak pernah ada "fake download" yang gagal jadi file.
 * ponytail: ganti isi fungsi dengan library (jspdf/docx) saat dibutuhkan;
 * signature exportPdf/exportDocx tetap, UI tidak berubah.
 */
export async function exportPDF(project) {
  return exportMarkdown(project)
}

export async function exportDOCX(project) {
  return exportMarkdown(project)
}
