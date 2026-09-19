// Self-check pemakaian AI: node test/usage.mjs
import assert from 'node:assert/strict'
import { computeUsage } from '../src/lib/usage.js'

const now = Math.floor(Date.now() / 1000)
const texts = ['halo dunia', 'hai! apa kabar hari ini', 'lama', 'juga lama sekali jawabannya']
const convs = [
  {
    id: 'c1',
    messages: {
      a: { role: 'user', content: texts[0], timestamp: now },
      b: { role: 'assistant', content: texts[1], timestamp: now },
    },
  },
  {
    id: 'c2',
    messages: {
      a: { role: 'user', content: texts[2], timestamp: now - 30 * 86400 },
      b: { role: 'assistant', content: texts[3], timestamp: now - 30 * 86400 },
    },
  },
  { id: 'c3', messages: {} },
]

const u = computeUsage(convs)
assert.equal(u.estTokens, Math.round(texts.join('').length / 4))
assert.deepEqual(Object.keys(u), ['estTokens'])

// kosong / rusak tidak melempar
assert.deepEqual(computeUsage([]), { estTokens: 0 })
computeUsage([null, { messages: { x: null } }, { messages: { x: { role: 'user' } } }])

console.log('usage: OK')
