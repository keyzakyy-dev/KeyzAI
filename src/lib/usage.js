/**
 * Estimasi pemakaian token dari pohon percakapan lokal (~4 karakter/token).
 * Total + deret harian 14 hari untuk chart. Batas hari memakai timezone lokal.
 * ponytail: offset per-hari, asumsi tanpa DST (WIB).
 */
export function computeUsage(convs = []) {
  let chars = 0
  const DAY = 86400000
  const localDayKey = (ms) => Math.floor((ms - new Date(ms).getTimezoneOffset() * 60000) / DAY)
  const todayKey = localDayKey(Date.now())
  const days = Array.from({ length: 14 }, (_, i) => ({ key: todayKey - 13 + i, chars: 0 }))
  const dayPos = new Map(days.map((d, i) => [d.key, i]))

  for (const c of convs) {
    if (!c || !c.messages) continue
    for (const m of Object.values(c.messages)) {
      if (!m || typeof m.content !== 'string' || !m.content) continue
      chars += m.content.length
      const pos = dayPos.get(localDayKey(m.timestamp * 1000))
      if (pos != null) days[pos].chars += m.content.length
    }
  }

  return {
    estTokens: Math.round(chars / 4),
    days: days.map((d) => ({
      date: d.key * DAY + new Date(d.key * DAY).getTimezoneOffset() * 60000,
      tokens: Math.round(d.chars / 4),
    })),
  }
}
