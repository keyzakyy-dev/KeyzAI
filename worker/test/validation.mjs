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
console.log('worker validation: OK')
