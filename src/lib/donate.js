/**
 * Data donasi untuk announcement popup di /chat.
 *
 * Cara isi: isi `value` untuk metode yang kamu punya. Baris yang `value`-nya
 * kosong OTOMATIS disembunyikan dari popup — jadi tidak ada nomor rekening
 * palsu yang tampil di live site saat belum diisi.
 *
 * `logo` opsional: path gambar di public/ (mis. /banks/bri.png). Kalau file
 * belum ada atau gagal dimuat, baris tetap tampil tanpa logo (bukan crash).
 *
 * Untuk QRIS: taruh gambar (mis. qris.png) di src/assets/, import di sini,
 * lalu set value-nya ke variabel import tersebut.
 *
 * Contoh:
 *   import qris from '../assets/qris.png'
 *   { type: 'QRIS', label: 'QRIS', value: qris }
 */
export const DONATIONS = [
  { type: 'Bank', label: 'BRI', value: '418301050098530', logo: '/banks/bri.png' },
  { type: 'Bank', label: 'SeaBank', value: '901803379494', logo: '/banks/seabank.png' },
  { type: 'E-wallet', label: 'DANA / GoPay / ShopeePay', value: '085166664226' },
]

// Opsional: catatan tambahan di bawah daftar, mis. atas nama pemilik rekening.
export const DONATION_NOTE = 'Atas nama: SAYYID DZAKY FARHAN'

// Hanya metode yang sudah diisi yang ditampilkan.
export const visibleDonations = () =>
  DONATIONS.filter((d) => typeof d.value === 'string' && d.value.trim().length > 0)
