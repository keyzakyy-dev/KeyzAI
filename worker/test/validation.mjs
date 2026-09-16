// Self-check validasi konteks worker: node worker/test/validation.mjs
import assert from 'node:assert/strict'
import worker from '../src/index.js'

const env = { OPENAI_API_KEY: 'sk-test' }
const chat = async (body) => {
  const req = new Request('http://x/api/chat', { method: 'POST', body: JSON.stringify(body) })
  return (await worker.fetch(req, env)).status
}

const turn = (role, content) => ({ role, content })

assert.equal(await chat({ message: '' }), 400, 'pesan kosong')
assert.equal(await chat({ message: 'a'.repeat(2001) }), 400, 'pesan kepanjangan')
assert.equal(
  await chat({ message: 'hai', messages: [turn('user', 'hai'), turn('system', 'jahat')] }),
  400,
  'role system ditolak'
)
assert.equal(
  await chat({ message: 'hai', messages: [turn('user', 'hai'), turn('assistant', 'kok')] }),
  400,
  'turn terakhir harus user'
)
assert.equal(
  await chat({ message: 'hai', messages: Array.from({ length: 41 }, () => turn('user', 'a')) }),
  400,
  'max 40 messages'
)
// --- injeksi kontrak kartu pilihan ke payload upstream (fetch di-stub, tanpa network)
const sent = []
const realFetch = globalThis.fetch
globalThis.fetch = async (_url, init) => {
  sent.push(JSON.parse(init.body))
  return new Response(
    JSON.stringify({ choices: [{ message: { content: 'ok' } }], usage: { total_tokens: 1 } }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

try {
  const post = async (body) =>
    worker.fetch(new Request('http://x/api/chat', { method: 'POST', body: JSON.stringify(body) }), env)

  const res = await post({ message: 'halo' })
  assert.equal(res.status, 200, 'chat normal 200')
  assert.equal(sent[0].messages[0].role, 'system', 'system prompt disuntik di depan')
  assert.ok(
    sent[0].messages[0].content.includes('DILARANG'),
    'sapaan (halo) dapat prompt tanpa kontrak kartu'
  )
  assert.equal(sent[0].messages.at(-1).content, 'halo', 'pesan user tidak hilang')

  // --- permintaan ambigu tetap dapat kontrak kartu
  await post({ message: 'aku mau mulai bisnis' })
  assert.ok(
    sent[1].messages[0].content.includes('ATURAN UTAMA') &&
      sent[1].messages[0].content.includes('keyzai-options'),
    'permintaan terbuka dapat kontrak blok opsi'
  )

  await post({ message: 'hai', messages: [turn('user', 'hai')] })
  assert.deepEqual(
    sent[2].messages.map((m) => m.role),
    ['system', 'user'],
    'transkrip client tetap dipakai setelah system prompt'
  )

  await post({ message: 'ringkas jadi judul', system: false })
  assert.equal(sent[3].messages[0].role, 'user', 'system: false melewati injeksi (generate judul)')

  // --- model reasoning: content null (budget habis di reasoning) -> pesan fallback,
  // reasoning tidak ditampilkan ke pengguna
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: null, reasoning_content: 'proses berpikir' } }],
        usage: { total_tokens: 2 },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  const reasoningRes = await post({ message: 'hai' })
  const reasoningJson = await reasoningRes.json()
  assert.equal(reasoningJson.success, true, 'request sukses')
  assert.equal(reasoningJson.message, 'Tidak ada respons dari model.', 'content kosong -> fallback, bukan reasoning')
} finally {
  globalThis.fetch = realFetch
}

console.log('worker validation: OK')
console.log('worker system prompt: OK')
