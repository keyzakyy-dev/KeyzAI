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
assert.equal(u.todayTokens, Math.round((texts[0].length + texts[1].length) / 4))

// chart token harian: hanya hari ini terisi (pesan lain 30 hari lalu)
assert.equal(u.days.length, 14)
assert.equal(u.days.at(-1).tokens, Math.round((texts[0].length + texts[1].length) / 4))
assert.ok(u.days.slice(0, 13).every((d) => d.tokens === 0))
const today = new Date(u.days.at(-1).date)
assert.ok(today.toDateString() === new Date().toDateString(), `baris terakhir bukan hari ini: ${today}`)

// kosong / rusak tidak melempar
const e = computeUsage([])
assert.equal(e.estTokens, 0)
assert.equal(e.days.length, 14)
assert.ok(e.days.every((d) => d.tokens === 0))
computeUsage([null, { messages: { x: null } }, { messages: { x: { role: 'user' } } }])

console.log('usage: OK')
