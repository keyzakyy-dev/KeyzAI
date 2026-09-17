import { Link } from 'react-router-dom'
import { usePageMeta } from '../lib/seo'
import { ArrowRightIcon } from '@radix-ui/react-icons'

import logo from '../assets/logo.png'

const UPDATED = '17 September 2026'

const PRIVACY = {
  slug: '/privacy',
  title: 'Kebijakan Privasi',
  intro:
    'Privasimu adalah bagian dari produk kami, bukan komoditas. Dokumen ini menjelaskan data apa yang kami simpan, untuk apa, dan bagaimana kamu mengendalikannya.',
  sections: [
    {
      h: 'Data yang kami kumpulkan',
      p: [
        'Saat kamu masuk dengan Google, kami menerima nama, alamat email, foto profil, dan pengenal unik akun Google (sub). Ini dipakai semata-mata untuk membuat akun KeyzAI-mu dan mengenali kamu kembali.',
        'Percakapan yang kamu buat (pesan, cabang hasil edit/regenerate, judul, dan waktu) disimpan di database kami (Cloudflare D1) supaya riwayatmu tersinkron di semua perangkat.',
        'Preferensi seperti model default, lebar sidebar, dan nama tampilan ikut disimpan bersama akunmu.',
      ],
    },
    {
      h: 'Bagaimana datanya dipakai',
      p: [
        'Data percakapan hanya dipakai untuk melayani permintaanmu: pesan yang kamu kirim diteruskan ke penyedia model AI pihak ketiga (Atria) untuk diproses menjadi respons, lalu hasilnya ditampilkan kepadamu.',
        'Kami tidak menjual data pribadimu kepada siapa pun, tidak menargetkan iklan berdasarkan isinya, dan tidak melacak kamu lintas situs.',
      ],
    },
    {
      h: 'Penyimpanan dan keamanan',
      p: [
        'Percakapan juga disimpan di perangkatmu sendiri (localStorage browser) sebagai cache; kamu bisa menghapusnya kapan saja dari aplikasi.',
        'Akses ke data di server kami dilindungi sesi login (JWT bertanda tangan). Semua query data dikunci ke akun pemiliknya.',
        'Tidak ada sistem yang 100% aman; bila terjadi insiden yang menyentuh data akunmu, kami akan memberi tahu.',
      ],
    },
    {
      h: 'Kontrol atasmu',
      p: [
        'Kamu dapat menghapus satu percakapan atau seluruh riwayatmu langsung dari aplikasi (menu percakapan → hapus, dan Pengaturan → hapus semua data).',
        'Kamu dapat mengekspor riwayatmu kapan saja sebagai file JSON.',
        'Ingin akunmu dihapus permanen? Hubungi kami lewat GitHub (link di footer) dan kami hapus baris akunmu beserta seluruh percakapannya.',
      ],
    },
    {
      h: 'Cookie & penyimpanan lokal',
      p: [
        'Kami tidak memakai cookie pelacak. Token sesi dan cache riwayat disimpan di penyimpanan lokal browser milikmu sendiri.',
      ],
    },
    {
      h: 'Perubahan kebijakan',
      p: ['Bila kebijakan ini berubah secara material, halaman ini kami perbarui beserta tanggal efektif di atas.'],
    },
  ],
}

const TERMS = {
  slug: '/terms',
  title: 'Syarat & Ketentuan',
  intro:
    'Dengan menggunakan KeyzAI, kamu menyetujui syarat berikut. Intinya: gratis, pakai dengan sehat, dan tanggung jawab akhir tetap di tanganmu.',
  sections: [
    {
      h: 'Layanan',
      p: [
        'KeyzAI adalah antarmuka chat untuk model AI pihak ketiga. Layanan disediakan gratis "sebagaimana adanya" dan dapat berubah atau berhenti kapan saja.',
      ],
    },
    {
      h: 'Akun',
      p: [
        'Kamu masuk dengan akun Google dan bertanggung jawab menjaga akses akunmu. Riwayat yang terlihat di akunmu dianggap perbuatan pemiliknya.',
      ],
    },
    {
      h: 'Penggunaan yang wajar',
      p: [
        'Dilarang memakai KeyzAI untuk hal ilegal, menyebarkan materi berbahaya, mengganggu layanan (mis. serangan otomatis di luar batas kewajaran), atau mencoba mengakali batasan akses.',
        'Kami dapat membatasi atau menangguhkan akses yang melanggar syarat ini.',
      ],
    },
    {
      h: 'Isi dan jawaban AI',
      p: [
        'Kamu tetap pemilik isi yang kamu buat. Jawaban AI bisa salah, jangan jadikan satu-satunya dasar keputusan penting (medis, hukum, keuangan).',
        'Kami tidak menjamin ketersediaan atau akurasi model pihak ketiga.',
      ],
    },
    {
      h: 'Batas tanggung jawab',
      p: [
        'Sampai batas tertinggi yang diizinkan hukum, KeyzAI tidak bertanggung jawab atas kerugian tak langsung yang timbul dari penggunaan layanan.',
      ],
    },
    {
      h: 'Ketentuan lain',
      p: ['Pertanyaan tentang syarat ini bisa dikirim lewat GitHub yang tertaut di footer halaman.'],
    },
  ],
}

function LegalLayout({ doc, other }) {
  usePageMeta({ title: doc.title, description: doc.intro, path: doc.slug })
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Kembali ke beranda" className="rounded-xl transition-opacity hover:opacity-80">
            <img src={logo} alt="KeyzAI" className="h-8 w-auto" />
          </Link>
          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Kembali ke chat
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">{doc.title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">Berlaku sejak {UPDATED}</p>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">{doc.intro}</p>

        {doc.sections.map((s) => (
          <section key={s.h} className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{s.h}</h2>
            {s.p.map((para, i) => (
              <p key={i} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {para}
              </p>
            ))}
          </section>
        ))}

        <p className="mt-12 text-sm text-muted-foreground">
          Ini halaman {doc.title.toLowerCase()}.{' '}
          <Link to={other.slug} className="font-medium text-foreground underline-offset-4 hover:underline">
            Baca {other.title}
          </Link>
          .
        </p>
      </main>
    </div>
  )
}

export function PrivacyPage() {
  return <LegalLayout doc={PRIVACY} other={TERMS} />
}

export function TermsPage() {
  return <LegalLayout doc={TERMS} other={PRIVACY} />
}
