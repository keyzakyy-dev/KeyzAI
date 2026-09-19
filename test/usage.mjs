// Self-check pemakaian AI: node test/usage.mjs
import assert from 'node:assert/strict'
import { computeUsage } from '../src/lib/usage.js'

const now = Math.floor(Date.now() / 1000)
const convs = [
  {
    id: 'c1',
    messages: {
      a: { role: 'user', content: 'halo dunia', timestamp: now },
      b: { role: 'assistant', content: 'hai! apa kabar hari ini', timestamp: now },
    },
  },
  {
    id: 'c2',
    messages: {
      a: { role: 'user', content: 'lama', timestamp: now - 30 * 86400 },
      b: { role: 'assistant', content: 'juga lama sekali jawabannya', timestamp: now - 30 * 86400 },
    },
  },
  { id: 'c3', messages: {} },
]

const u = computeUsage(convs)
assert.equal(u.conversations, 3)
assert.equal(u.messages, 4)
assert.equal(u.user, 2)
assert.equal(u.ai, 2)
assert.equal(u.week, 2) // hanya pesan minggu ini
assert.equal(u.aiWords, 5 + 4)
assert.equal(u.estTokens, Math.round(('halo dunia'.length + 'hai! apa kabar hari ini'.length + 'lama'.length + 'juga lama sekali jawabannya'.length) / 4))

// kosong / rusak tidak melempar
assert.deepEqual(computeUsage([]), { conversations: 0, messages: 0, user: 0, ai: 0, aiWords: 0, week: 0, estTokens: 0 })
computeUsage([null, { messages: { x: null } }, { messages: { x: { role: 'user' } } }])

console.log('usage: OK')
