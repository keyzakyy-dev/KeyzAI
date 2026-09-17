// Self-check model pohon pesan + persistence: node test/state-tree.mjs
import assert from 'node:assert/strict'
import {
  MSG_STATE,
  newMessage,
  newConversation,
  getActivePath,
  getContextFromAnchor,
  attachMessage,
  detachSubtree,
  navigateBranch,
  hasSiblings,
  deepestLeaf,
  serializeConv,
} from '../src/state/tree.js'
import { loadState, saveState, freshState } from '../src/state/persistence.js'
import { newId } from '../src/state/ids.js'

// ---------- ids
const a = newId('msg')
const b = newId('msg')
assert.ok(a.startsWith('msg_') && b.startsWith('msg_'), 'prefix ikut')
assert.notEqual(a, b, 'id unik')

// ---------- message / conversation
const user = newMessage({ id: 'u1', role: 'user', content: 'halo', timestamp: 1000 })
assert.equal(user.state, MSG_STATE.DONE, 'user langsung done')
const ai = newMessage({ id: 'a1', role: 'assistant', content: '', timestamp: 1001, parentId: 'u1' })
assert.equal(ai.state, MSG_STATE.STREAMING, 'assistant mulai streaming')
assert.throws(() => newMessage({ id: 'x', role: 'system' }), 'role asing ditolak')

let conv = newConversation('c1', { title: 'tes', createdAt: 5000 })
assert.equal(getActivePath(conv).length, 0, 'conv kosong tak punya rantai')

// ---------- attach: bangun rantai u1 -> a1 -> u2
conv = attachMessage(conv, user)
assert.equal(conv.rootId, 'u1', 'pesan pertama jadi root')
assert.equal(conv.activeLeafId, 'u1', 'leaf = pesan terakhir')
conv = attachMessage(conv, ai)
assert.deepEqual(conv.messages.u1.children, ['a1'], 'parent menaut child')
conv = attachMessage(conv, newMessage({ id: 'u2', role: 'user', content: 'lanjut', timestamp: 1002, parentId: 'a1' }))
assert.equal(conv.activeLeafId, 'u2')
assert.equal(getActivePath(conv).map((m) => m.id).join('>'), 'u1>a1>u2', 'rantai aktif benar')

// ---------- context: potong ke limit
const ctx = getContextFromAnchor(conv, 'u2', 2)
assert.deepEqual(ctx, [{ role: 'assistant', content: '' }, { role: 'user', content: 'lanjut' }], 'context terpotong dari depan')
assert.equal(getContextFromAnchor(conv, null).length, 0, 'anchor null = tanpa konteks')

// ---------- branching: regenerate buat sibling AI
conv = attachMessage(conv, newMessage({ id: 'a1b', role: 'assistant', content: 'jawab 2', timestamp: 1003, parentId: 'u1' }))
assert.deepEqual(conv.messages.u1.children, ['a1', 'a1b'], 'dua cabang AI under u1')
assert.ok(hasSiblings(conv, 'a1'), 'a1 punya sibling')
assert.equal(getActivePath(conv).map((m) => m.id).join('>'), 'u1>a1b', 'leaf pindah ke cabang baru')

// navigasi: mundur ke cabang lama (ikut kelanjutannya), maju lagi
assert.equal(navigateBranch(conv, 'a1b', 'prev'), 'u2', 'prev ke cabang lama + kelanjutannya')
assert.equal(navigateBranch(conv, 'a1', 'next'), 'a1b', 'next ke cabang baru')
assert.equal(navigateBranch(conv, 'a1', 'prev'), null, 'sudah paling awal')
assert.equal(navigateBranch(conv, 'u1', 'next'), null, 'root tanpa sibling')

// navigasi turun ke daun: a1 punya child u2
assert.equal(deepestLeaf(conv.messages, 'a1'), 'u2', 'deepestLeaf turun ke u2')
conv = attachMessage(conv, newMessage({ id: 'a1c', role: 'assistant', content: 'jawab 3', timestamp: 1004, parentId: 'u1' }))
assert.equal(deepestLeaf(conv.messages, 'a1'), 'u2', 'cabang lain tidak ubah daun a1')

// ---------- detach: buang bubble kosong + orphan
let dirty = attachMessage(newConversation('c2'), newMessage({ id: 'u9', role: 'user', content: 'x', timestamp: 1 }))
dirty = attachMessage(dirty, newMessage({ id: 'a9', role: 'assistant', content: '', timestamp: 2, parentId: 'u9' }))
dirty = attachMessage(dirty, newMessage({ id: 'u10', role: 'user', content: 'y', timestamp: 3, parentId: 'a9' }))
assert.equal(getActivePath(dirty).length, 3, 'sebelum detach')
const cut = detachSubtree(dirty, 'a9')
assert.ok(!cut.messages.a9 && !cut.messages.u10, 'subtree terbuang')
assert.deepEqual(cut.messages.u9.children, [], 'child di-unlink dari parent')
assert.equal(cut.activeLeafId, 'u9', 'leaf balik ke parent')
assert.equal(getActivePath(cut).length, 1, 'hanya user tersisa')

// detach node tengah membawa semua turunannya
const mid = detachSubtree(dirty, 'u9')
assert.equal(mid.rootId, null, 'root terhapus')
assert.equal(getActivePath(mid).length, 0, 'pohon jadi kosong')

// ---------- serialize (export)
const ex = serializeConv(attachMessage(newConversation('c3', { title: 'ekspor' }), user))
assert.ok(Array.isArray(ex.messages), 'messages kembali jadi array')
assert.ok(!ex.messages[0].children && !ex.messages[0].state, 'field internal pohon dibuang')

// ---------- persistence: legacy linear -> pohon
const legacy = {
  convs: [
    {
      id: 'c1',
      title: 'lama',
      createdAt: 100,
      pinned: true,
      messages: [
        { id: 'm1', role: 'user', content: 'hai', timestamp: 1 },
        { id: 'm2', role: 'assistant', content: 'halo', timestamp: 2 },
        { id: 'm3', role: 'assistant', content: '', timestamp: 3 }, // bubble mati
      ],
    },
  ],
  activeId: 'c1',
}
const mem = new Map()
const storage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => mem.set(k, v),
}
let loaded = loadState(storage)
assert.deepEqual(loaded, freshState(), 'storage kosong = state segar')

mem.set('keyzai-state', JSON.stringify(legacy))
loaded = loadState(storage)
assert.equal(loaded.v, 3, 'legacy di-migrate ke v3')
assert.equal(loaded.convs.length, 1)
const c = loaded.convs[0]
assert.equal(c.rootId, 'm1', 'root = pesan pertama')
assert.equal(c.activeLeafId, 'm2', 'bubble kosong dibuang, leaf = pesan valid terakhir')
assert.deepEqual(c.messages.m1.children, ['m2'], 'rantai tunggal terbentuk')
assert.equal(c.messages.m2.parentId, 'm1')
assert.equal(c.pinned, true, 'pinned dipertahankan')

// ---------- persistence: round-trip v3
const err = saveState(loaded, storage)
assert.equal(err, null, 'simpan sukses')
const again = loadState(storage)
assert.equal(again.convs[0].id, 'c1', 'round-trip v3 utuh')
assert.equal(again.activeId, 'c1')

// ---------- persistence: data rusak tidak crash
mem.set('keyzai-state', '{bukan json')
assert.deepEqual(loadState(storage), freshState(), 'JSON rusak → state segar')
mem.set('keyzai-state', JSON.stringify({ v: 99, convs: [], activeId: null }))
assert.deepEqual(loadState(storage), freshState(), 'versi masa depan tidak dimuat')
mem.set('keyzai-state', JSON.stringify({ v: 3, convs: [{ id: 'x', messages: { a: { id: 'b' } } }], activeId: 'x' }))
const broken = loadState(storage)
assert.equal(broken.convs.length, 1, 'conv disimpan')
assert.equal(broken.convs[0].messages && Object.keys(broken.convs[0].messages).length, 0, 'pesan dengan id tidak cocok dibuang')
assert.equal(broken.convs[0].rootId, null, 'root null = pohon kosong, bukan crash')

// ---------- persistence: self-heal title
mem.set(
  'keyzai-state',
  JSON.stringify({ v: 3, convs: [{ id: 'c4', title: '', rootId: 'q1', activeLeafId: 'q1', messages: { q1: { id: 'q1', role: 'user', content: 'judulan panjang sekali ini sekali lagi', timestamp: 1, parentId: null, children: [], state: 'done' } } }], activeId: 'c4' }),
)
assert.equal(loadState(storage).convs[0].title, 'judulan panjang sekali ini sek...', 'title fallback dari pesan pertama')

console.log('state tree + persistence: OK')
