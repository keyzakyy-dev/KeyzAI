/**
 * Estimasi pemakaian token dari pohon percakapan lokal (~4 karakter/token).
 * Cukup token saja — metrik lain tidak ditampilkan.
 */
export function computeUsage(convs = []) {
  let chars = 0
  for (const c of convs) {
    if (!c || !c.messages) continue
    for (const m of Object.values(c.messages)) {
      if (m && typeof m.content === 'string' && m.content) chars += m.content.length
    }
  }
  return { estTokens: Math.round(chars / 4) }
}
