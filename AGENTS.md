# KeyzAI

## Workflow
- Setiap selesai mengubah file (edit/fix/fitur), langsung `git add` (hanya file yang diubah), commit dengan pesan ringkas bahasa Inggris gaya konvensional, lalu `git push origin main`. Tanpa konfirmasi ulang.
- Jangan pernah commit file yang tidak berkaitan dengan perubahan saat itu.
- Jika ada perubahan di `worker/`, deploy Cloudflare Worker setelah push (cari perintah deploy di `worker/package.json`).
- Landing page (src/pages/LandingPage.jsx) = halaman publik utama; chat app di src/components.
- Stack: Vite + React + Tailwind; test: `node test/*.mjs`.
