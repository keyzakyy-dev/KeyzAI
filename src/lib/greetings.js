/**
 * Sapaan halaman chat kosong ("Ada yang bisa dibantu?" berganti tiap Chat baru).
 * pickGreeting memastikan tidak mengulang sapaan yang sama dua kali beruntun,
 * dan mempersonalisasi dengan nama pengguna + waktu setempat bila tersedia.
 */

export function timePart(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 11) return 'pagi'
  if (hour >= 11 && hour < 15) return 'siang'
  if (hour >= 15 && hour < 18) return 'sore'
  return 'malam'
}

export function pickGreeting({ previous = null, name = '', hour = new Date().getHours() } = {}) {
  const time = timePart(hour)
  const pool = []

  if (name) {
    pool.push(
      `Halo ${name}, ada yang bisa kubantu?`,
      `Halo ${name}, mau bahas apa hari ini?`,
      `Halo ${name}, apa yang sedang kamu pikirkan?`,
      `Selamat ${time}, ${name}. Ada yang bisa dibantu?`,
    )
  }

  pool.push(
    'Ada yang bisa dibantu?',
    `Selamat ${time}. Ada yang bisa dibantu?`,
    'Mau bahas apa hari ini?',
    'Ada ide yang ingin dikembangkan?',
    'Apa yang ingin kamu pelajari?',
    'Mulai dari mana? Aku bantu jalankan.',
    'Ada yang bisa kubantu kerjakan?',
    'Ceritakan, apa yang sedang kamu pikirkan?',
    'Mau ngobrol, riset, atau nulis sesuatu?',
  )

  const options = previous ? pool.filter((g) => g !== previous) : pool
  const candidates = options.length ? options : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}