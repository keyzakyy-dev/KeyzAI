// Self-check alur percakapan: node test/chat-flow.mjs
// Memverifikasi konteks API yang dibangun useChatStream untuk tiap mode,
// menggunakan model pohon murni (tanpa React).
import assert from 'node:assert/strict'
import { chatReducer } from '../src/state/chat-reducer.js'
import { getContextFromAnchor, newMessage, getActivePath } from '../src/state/tree.js'
import { newId } from '../src/state/ids.js'

// Simulasi useChatStream: dispatch START_SEND dan hitung context seperti hook.
function convOf(state, id) {
  return state.convs.find((c) => c.id === id)
}

let state = { v: 3, convs: [], activeId: null, error: null, lastSent: null }

// ---------- 1. pesan pertama di chat baru
const convId = 'c1'
const u1 = newMessage({ id: 'u1', role: 'user', content: 'halo', timestamp: 1 })
const a1 = newMessage({ id: 'a1', role: 'assistant', content: '', timestamp: 2, parentId: 'u1' })
state = chatReducer(state, { type: 'START_SEND', convId, userMsg: u1, aiMsg: a1 })
assert.ok(convOf(state, convId), 'conv dibuat')
// context dihitung SEBELUM dispatch (seperti hook) → chat baru kosong
assert.deepEqual(getContextFromAnchor(null, null, 20), [], 'chat baru: context kosong')

state = chatReducer(state, { type: 'STREAM_DONE', convId, msgId: 'a1', content: 'hai balas' })

// ---------- 2. pesan lanjutan: context berisi 1 turn
let conv = convOf(state, convId)
const anchor = conv.activeLeafId
const u2 = newMessage({ id: 'u2', role: 'user', content: 'lanjut', timestamp: 3, parentId: 'a1' })
const a2 = newMessage({ id: 'a2', role: 'assistant', content: '', timestamp: 4, parentId: 'u2' })
// context dihitung sebelum dispatch, lalu hook menambahkan pesan user baru
let ctx = [...getContextFromAnchor(conv, anchor, 20), { role: 'user', content: 'lanjut' }]
assert.deepEqual(
  ctx.map((m) => m.content),
  ['halo', 'hai balas', 'lanjut'],
  'context pesan lanjutan berisi rantai penuh',
)
state = chatReducer(state, { type: 'START_SEND', convId, userMsg: u2, aiMsg: a2 })
state = chatReducer(state, { type: 'STREAM_DONE', convId, msgId: 'a2', content: 'balas 2' })
conv = convOf(state, convId)

// ---------- 3. edit pesan user pertama → context terpotong di titik edit
const edited = conv.messages['u1']
// context sebelum dispatch: rantai ke parent pesan yang diedit + pesan baru
ctx = [...getContextFromAnchor(conv, edited.parentId, 20), { role: 'user', content: 'halo semua' }]
assert.deepEqual(ctx, [{ role: 'user', content: 'halo semua' }], 'edit pesan root: context hanya pesan baru')
const u1e = newMessage({ id: 'u1e', role: 'user', content: 'halo semua', timestamp: 5, parentId: edited.parentId })
const a1e = newMessage({ id: 'a1e', role: 'assistant', content: '', timestamp: 6, parentId: 'u1e' })
state = chatReducer(state, { type: 'START_SEND', convId, userMsg: u1e, aiMsg: a1e })
conv = convOf(state, convId)
assert.ok(conv.messages['u1'], 'pesan lama tidak hilang (tetap di pohon)')
state = chatReducer(state, { type: 'STREAM_DONE', convId, msgId: 'a1e', content: 'balas editan' })

// ---------- 4. regenerate: context berhenti di pesan user sumber
const userId = convOf(state, convId).messages['a2'].parentId // 'u2'
const a2b = newMessage({ id: 'a2b', role: 'assistant', content: '', timestamp: 7, parentId: userId })
state = chatReducer(state, { type: 'START_SEND', convId, userMsg: null, aiMsg: a2b })
conv = convOf(state, convId)
ctx = getContextFromAnchor(conv, userId, 20)
assert.deepEqual(
  ctx.map((m) => m.content),
  ['halo', 'hai balas', 'lanjut'],
  'regenerate: context sampai pesan user sumber (tidak termasuk AI lama)',
)
assert.equal(conv.messages['u2'].children.length, 2, 'AI baru jadi sibling')

// ---------- 5. navigasi cabang setelah regenerate menampilkan versi lain
const before = getActivePath(conv).map((m) => m.id).join('>')
state = chatReducer(state, { type: 'NAVIGATE_BRANCH', convId, msgId: 'a2b', dir: 'prev' })
const after = getActivePath(convOf(state, convId)).map((m) => m.id).join('>')
assert.notEqual(before, after, 'cabang aktif berganti')
assert.ok(after.includes('a2'), 'cabang lama kembali aktif')

// ---------- 6. limit context 20 pesan
let big = { ...conv }
for (let i = 0; i < 30; i++) {
  const uid = newId('u'), aid = newId('a')
  big = chatReducer(
    { v: 3, convs: [big], activeId: convId, error: null, lastSent: null },
    {
      type: 'START_SEND',
      convId,
      userMsg: newMessage({ id: uid, role: 'user', content: `p${i}`, timestamp: 100 + i, parentId: big.activeLeafId }),
      aiMsg: newMessage({ id: aid, role: 'assistant', content: `j${i}`, timestamp: 101 + i, parentId: uid }),
    },
  ).convs[0]
}
const chain = getContextFromAnchor(big, big.activeLeafId, 20)
assert.equal(chain.length, 20, 'context dipotong ke 20')
assert.equal(chain.at(-1).role, 'assistant', 'percakapan tersimpan berakhir di AI')
// hook menambahkan pesan user baru → context akhir memenuhi syarat worker
const bigCtx = [...chain, { role: 'user', content: 'pesan baru' }]
assert.equal(bigCtx.at(-1).role, 'user', 'context berakhir di pesan user (syarat worker)')
assert.ok(bigCtx.length <= 40, 'masih di bawah batas 40 pesan worker')

console.log('chat flow: OK')
