/**
 * Statistik penggunaan AI dihitung dari pohon percakapan lokal.
 * Token bersifat estimasi (~4 karakter/token) — akurat untuk tampilan
 * "sekitar", bukan tagihan.
 */
export function computeUsage(convs = []) {
  let messages = 0
  let user = 0
  let ai = 0
  let chars = 0
  let aiWords = 0
  let week = 0
  const cutoff = (Date.now() - 7 * 86400000) / 1000

  for (const c of convs) {
    if (!c || !c.messages) continue
    for (const m of Object.values(c.messages)) {
      if (!m || typeof m.content !== 'string' || !m.content) continue
      messages++
      chars += m.content.length
      if (m.role === 'user') user++
      else if (m.role === 'assistant') {
        ai++
        aiWords += m.content.trim().split(/\s+/).length
      }
      if (m.timestamp && m.timestamp >= cutoff) week++
    }
  }

  return {
    conversations: convs.length,
    messages,
    user,
    ai,
    aiWords,
    week,
    estTokens: Math.round(chars / 4),
  }
}
