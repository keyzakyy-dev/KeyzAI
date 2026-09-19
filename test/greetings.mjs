import { pickGreeting, timePart } from '../src/lib/greetings.js'
import assert from 'node:assert/strict'

assert.equal(timePart(6), 'pagi')
assert.equal(timePart(12), 'siang')
assert.equal(timePart(16), 'sore')
assert.equal(timePart(22), 'malam')

// nama panjang → hanya nama depan di sapaan
for (let i = 0; i < 200; i++) {
  const g = pickGreeting({ name: 'Sayyid Dzaky Farhan' })
  assert.ok(!g.includes('Dzaky'), `nama belakang bocor: ${g}`)
  assert.ok(!g.includes('Sayyid Dzaky'), `nama penuh bocor: ${g}`)
}
// pool bercampur greeting generik — pastikan variasi bernama muncul & hanya nama depan
let sawNamed = false
for (let i = 0; i < 500 && !sawNamed; i++) {
  const g = pickGreeting({ name: 'Sayyid Dzaky Farhan' })
  assert.ok(!g.includes('Dzaky'), `nama belakang bocor: ${g}`)
  assert.ok(!g.includes('Sayyid Dzaky'), `nama penuh bocor: ${g}`)
  if (g.includes('Sayyid')) sawNamed = true
}
assert.ok(sawNamed, 'variasi bernama tidak pernah muncul')
// tanpa nama → tetap jalan
pickGreeting({})
console.log('greetings: OK')
