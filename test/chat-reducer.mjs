// Self-check reducer: node test/chat-reducer.mjs
import assert from 'node:assert/strict'
import { chatReducer } from '../src/state/chat-reducer.js'
import { MSG_STATE, newMessage, getActivePath } from '../src/state/tree.js'
import { newId } from '../src/state/ids.js'

function send(state, convId, userText, parentId = null) {
  const userMsg = newMessage({ id: newId('u'), role: 'user', content: userText, timestamp: 1, parentId })
  const aiMsg = newMessage({ id: newId('a'), role: 'assistant', content: '', timestamp: 2, parentId: userMsg.id })
  return { state: chatReducer(state, { type: 'START_SEND', convId, userMsg, aiMsg }), userMsg, aiMsg }
}

let state = { v: 3, convs: [], activeId: null, error: null, lastSent: null }

// ---------- START_SEND buat conv optimis
let r = send(state, 'c1', 'halo')
state = r.state
assert.equal(state.convs.length, 1, 'conv dibuat saat pesan pertama')
assert.equal(state.activeId, 'c1')
assert.equal(state.convs[0].title, 'halo', 'title fallback')
assert.equal(state.convs[0].titlePending, true, 'judul pending sampai diganti')
assert.equal(state.lastSent, 'halo', 'lastSent untuk retry')
assert.equal(state.error, null)

const leaf = getActivePath(state.convs[0])
assert.equal(leaf.at(-1).id, r.aiMsg.id, 'leaf = AI bubble streaming')
assert.equal(leaf.at(-1).state, MSG_STATE.STREAMING)

// ---------- STREAM_DELTA (akumulatif) lalu DONE
state = chatReducer(state, { type: 'STREAM_DELTA', convId: 'c1', msgId: r.aiMsg.id, content: 'Halo' })
state = chatReducer(state, { type: 'STREAM_DELTA', convId: 'c1', msgId: r.aiMsg.id, content: 'Halo, apa' })
assert.equal(state.convs[0].messages[r.aiMsg.id].content, 'Halo, apa')
assert.equal(state.convs[0].messages[r.aiMsg.id].state, MSG_STATE.STREAMING)
state = chatReducer(state, { type: 'STREAM_DONE', convId: 'c1', msgId: r.aiMsg.id, content: 'Halo, apa kabar?' })
assert.equal(state.convs[0].messages[r.aiMsg.id].content, 'Halo, apa kabar?')
assert.equal(state.convs[0].messages[r.aiMsg.id].state, MSG_STATE.DONE)

// ---------- pesan kedua melanjutkan leaf lama
const before = state.convs[0].activeLeafId
r = send(state, 'c1', 'lanjut', before)
state = r.state
assert.equal(state.convs.length, 1, 'masih satu conv')
assert.equal(state.convs[0].messages[before].children.length, 1, 'user baru menempel di leaf lama')
const u2 = r.userMsg.id

// ---------- branching: regenerate AI jadi sibling (tanpa pesan user baru)
const userHead = state.convs[0].messages[before].parentId
const aiB = newId('a')
state = chatReducer(state, {
  type: 'START_SEND',
  convId: 'c1',
  userMsg: null,
  aiMsg: newMessage({ id: aiB, role: 'assistant', content: '', timestamp: 4, parentId: userHead }),
  lastSent: state.convs[0].messages[userHead].content,
})
assert.equal(state.convs[0].messages[userHead].children.length, 2, 'AI sibling baru terbentuk')
assert.equal(getActivePath(state.convs[0]).at(-1).id, aiB, 'cabang baru jadi aktif')
assert.equal(state.lastSent, 'halo', 'regenerate memakai konten user lama sebagai lastSent')
state = chatReducer(state, { type: 'STREAM_DONE', convId: 'c1', msgId: aiB, content: 'jawaban 2' })

// navigasi cabang: prev kembali ke cabang lama (+kelanjutannya), next balik
state = chatReducer(state, { type: 'NAVIGATE_BRANCH', convId: 'c1', msgId: aiB, dir: 'prev' })
assert.equal(getActivePath(state.convs[0]).at(-1).id, r.aiMsg.id, 'prev menampilkan kelanjutan cabang lama')
state = chatReducer(state, { type: 'NAVIGATE_BRANCH', convId: 'c1', msgId: before, dir: 'next' })
assert.equal(getActivePath(state.convs[0]).at(-1).id, aiB)

// ---------- STREAM_EMPTY: buang bubble kosong
let r2 = send(state, 'c1', 'kosong')
state = r2.state
state = chatReducer(state, { type: 'STREAM_EMPTY', convId: 'c1', msgId: r2.aiMsg.id })
assert.ok(!state.convs[0].messages[r2.aiMsg.id], 'bubble kosong dibuang')
assert.equal(state.convs[0].messages[r2.userMsg.id].children.length, 0, 'user message tetap')
assert.ok(state.error, 'error diset')

// ---------- ABORT sebelum token
let r3 = send(state, 'c1', 'hentikan')
state = r3.state
state = chatReducer(state, { type: 'ABORT', convId: 'c1', msgId: r3.aiMsg.id, streamed: false })
assert.ok(!state.convs[0].messages[r3.aiMsg.id], 'bubble dibuang saat abort awal')
assert.equal(state.error, null, 'abort tanpa error')

// ---------- ABORT setelah token parsial dipertahankan
let r4 = send(state, 'c1', 'hentikan lagi')
state = r4.state
state = chatReducer(state, { type: 'STREAM_DELTA', convId: 'c1', msgId: r4.aiMsg.id, content: 'sebagian' })
state = chatReducer(state, { type: 'ABORT', convId: 'c1', msgId: r4.aiMsg.id, streamed: true })
assert.equal(state.convs[0].messages[r4.aiMsg.id].content, 'sebagian', 'konten parsial disimpan')
assert.equal(state.convs[0].messages[r4.aiMsg.id].state, MSG_STATE.ABORTED)

// ---------- STREAM_ERROR sebelum token
let r5 = send(state, 'c1', 'gagal')
state = r5.state
state = chatReducer(state, { type: 'STREAM_ERROR', convId: 'c1', msgId: r5.aiMsg.id, error: 'Server error', streamed: false })
assert.ok(!state.convs[0].messages[r5.aiMsg.id], 'bubble dibuang saat error awal')
assert.equal(state.error, 'Server error')
assert.equal(state.lastSent, 'gagal', 'lastSent untuk retry')

// ---------- pin / rename / title
state = chatReducer(state, { type: 'PIN', convId: 'c1', pinned: true })
assert.equal(state.convs[0].pinned, true)
state = chatReducer(state, { type: 'RENAME', convId: 'c1', title: 'diganti' })
assert.equal(state.convs[0].title, 'diganti')
assert.equal(state.convs[0].titlePending, false)
state = chatReducer(state, { type: 'SET_TITLE', convId: 'c1', title: 'judul final', titlePending: false })
assert.equal(state.convs[0].title, 'judul final')

// ---------- NEW_CHAT / SELECT_CHAT / CLEAR_ERROR
state = chatReducer(state, { type: 'NEW_CHAT', convId: 'c2' })
assert.equal(state.activeId, 'c2')
assert.equal(state.error, null)
state = chatReducer(state, { type: 'SELECT_CHAT', convId: 'c1' })
assert.equal(state.activeId, 'c1')
state = chatReducer(state, { type: 'SET_ERROR', error: 'x' })
state = chatReducer(state, { type: 'CLEAR_ERROR' })
assert.equal(state.error, null)

// ---------- DELETE_CONV + RESTORE (undo)
const snapshot = state.convs
state = chatReducer(state, { type: 'DELETE_CONV', convId: 'c1' })
assert.equal(state.convs.length, 0)
assert.equal(state.activeId, null, 'conv aktif dihapus → active null')
state = chatReducer(state, { type: 'RESTORE', convs: snapshot, activeId: 'c1' })
assert.equal(state.convs.length, 1, 'undo mengembalikan snapshot')
assert.equal(state.activeId, 'c1')

// ---------- CLEAR_ALL
state = chatReducer(state, { type: 'CLEAR_ALL' })
assert.deepEqual({ convs: state.convs, activeId: state.activeId, error: state.error }, { convs: [], activeId: null, error: null })

// ---------- REPLACE_ALL
// Jangan auto-select percakapan saat activeId tak ada di daftar (refresh
// saat di chat baru kosong harus tetap kosong, bukan loncat ke riwayat).
const phony = { v: 3, convs: [snapshot[0]], activeId: 'fik-tidak-ada', error: null, lastSent: null }
state = chatReducer(phony, { type: 'REPLACE_ALL', convs: [snapshot[0]] })
assert.equal(state.activeId, null, 'REPLACE_ALL tidak memilih conv secara otomatis')
assert.equal(state.convs.length, 1)
// Tapi tetap pertahankan activeId bila masih valid di daftar baru.
state = chatReducer({ ...phony, activeId: 'c1' }, { type: 'REPLACE_ALL', convs: [snapshot[0]] })
assert.equal(state.activeId, 'c1', 'activeId valid dipertahankan')
// Data malformed difilter.
state = chatReducer(phony, { type: 'REPLACE_ALL', convs: [null, { id: 'x' }, { id: 'y', messages: {} }] })
assert.equal(state.convs.length, 1, 'conv malformed difilter')
assert.equal(state.convs[0].id, 'y')

// ---------- aksi asing tidak mengubah state
const frozen = state
state = chatReducer(state, { type: 'UNKNOWN' })
assert.equal(state, frozen, 'aksi tak dikenal no-op')

// ---------- MERGE_CONV self-heal leaf (baris D1 lama: activeLeafId null)
let ms = { v: 3, convs: [{ id: 'm1', title: 'x', createdAt: 1, updatedAt: 2, messages: {} }], activeId: 'm1', error: null, lastSent: null }
ms = chatReducer(ms, {
  type: 'MERGE_CONV',
  conv: {
    id: 'm1',
    rootId: 'u1',
    activeLeafId: null,
    messages: {
      u1: { id: 'u1', role: 'user', content: 'halo', timestamp: 1, parentId: null, children: ['a1'], state: 'done' },
      a1: { id: 'a1', role: 'assistant', content: 'hai', timestamp: 2, parentId: 'u1', children: [], state: 'done' },
    },
  },
})
assert.equal(getActivePath(ms.convs[0]).length, 2, 'MERGE_CONV self-heal activeLeafId → isi terbuka')
// leaf valid tidak diubah
ms = chatReducer(ms, { type: 'MERGE_CONV', conv: { id: 'm1', rootId: 'u1', activeLeafId: 'u1', messages: ms.convs[0].messages } })
assert.equal(ms.convs[0].activeLeafId, 'u1', 'activeLeafId valid tidak ditimpa')

console.log('chat reducer: OK')
