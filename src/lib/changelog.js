/**
 * Changelog KeyzAI — data statis, dikurasi dari riwayat git.
 * type: 'new' (baru) | 'polish' (poles) | 'fix' (perbaikan)
 */
export const CHANGELOG = [
  {
    version: 'v1.5.0',
    date: '20 September 2026',
    tagline: 'Pemakaian AI & penyegaran tampilan',
    items: [
      { type: 'new', text: 'Pantau pemakaian AI: token hari ini & total, plus grafik 14 hari' },
      { type: 'new', text: 'Preferensi akun kini berbentuk tab: Akun, Preferensi, Pemakaian, Data' },
      { type: 'new', text: 'Mode terang nuansa abu batu; logo ikut menyesuaikan tema' },
      { type: 'new', text: 'Label "Free" di setiap model gratis' },
      { type: 'new', text: 'Info jumlah kata & waktu di setiap jawaban AI' },
      { type: 'polish', text: 'Ikon diperbarui menyeluruh; efek kilau saat AI berpikir' },
    ],
  },
  {
    version: 'v1.4.0',
    date: '19 September 2026',
    tagline: 'Model baru yang lebih cepat',
    items: [
      { type: 'new', text: 'Model baru: Qwen 3.8 Flash — jawaban lebih cepat, tetap gratis' },
    ],
  },
  {
    version: 'v1.3.0',
    date: '18 September 2026',
    tagline: 'Beranda & dialog baru',
    items: [
      { type: 'polish', text: 'Beranda didesain ulang: lebih bersih, ringan, dan cepat' },
      { type: 'polish', text: 'Popup masuk & donasi lebih ringkas, satu tujuan' },
    ],
  },
  {
    version: 'v1.2.0',
    date: '17 September 2026',
    tagline: 'Akun & riwayat di semua perangkat',
    items: [
      { type: 'new', text: 'Masuk dengan Google — riwayat chat tersimpan di semua perangkat' },
      { type: 'new', text: 'Edit pesan & buat ulang jawaban, dengan navigasi antar versi' },
      { type: 'new', text: 'Setiap percakapan punya tautan sendiri' },
      { type: 'new', text: 'Atur nama tampilan, model default, dan lebar sidebar dari preferensi' },
      { type: 'new', text: 'Tampilan brand baru' },
    ],
  },
  {
    version: 'v1.1.0',
    date: '16 September 2026',
    tagline: 'Model & saran topik',
    items: [
      { type: 'new', text: 'Pilihan model AI diperluas — lebih banyak model gratis' },
      { type: 'new', text: 'Kartu saran topik lanjutan muncul saat pertanyaan masih umum' },
      { type: 'fix', text: 'Perbaikan stabilitas koneksi' },
    ],
  },
  {
    version: 'v1.0.1',
    date: '15 September 2026',
    tagline: 'Perbaikan kecil',
    items: [
      { type: 'polish', text: 'Tampilan lebih halus: scrollbar ramping dan header lebih bersih' },
    ],
  },
  {
    version: 'v1.0.0',
    date: '14 September 2026',
    tagline: 'Rilis perdana',
    items: [
      { type: 'new', text: 'Jawaban AI muncul mengalir langsung, bisa dihentikan kapan saja' },
      { type: 'new', text: 'Percakapan tampil rapi: judul, daftar, tabel, dan blok kode dengan tombol salin' },
      { type: 'new', text: 'Riwayat chat tergrup otomatis: Hari ini, Kemarin, 7 hari terakhir' },
      { type: 'new', text: 'Judul percakapan dibuat otomatis' },
      { type: 'new', text: 'Mode gelap & terang' },
    ],
  },
]
