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

  // Deret 14 hari terakhir untuk chart; batas hari memakai timezone lokal.
  // ponytail: offset per-hari, asumsi tanpa DST (WIB).
  const DAY = 86400000
  const localDayKey = (ms) => Math.floor((ms - new Date(ms).getTimezoneOffset() * 60000) / DAY)
  const todayKey = localDayKey(Date.now())
  const days = Array.from({ length: 14 }, (_, i) => ({ key: todayKey - 13 + i, count: 0 }))
  const dayPos = new Map(days.map((d, i) => [d.key, i]))

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
      if (m.timestamp) {
        const pos = dayPos.get(localDayKey(m.timestamp * 1000))
        if (pos != null) days[pos].count++
      }
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
    days: days.map((d) => ({
      date: d.key * DAY + new Date(d.key * DAY).getTimezoneOffset() * 60000,
      count: d.count,
    })),
  }
}
