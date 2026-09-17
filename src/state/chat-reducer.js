/**
 * Reducer murni untuk state chat. Semua mutasi pohon pesan lewat aksi di sini;
 * tidak ada side-effect (no fetch, no localStorage) sehingga bisa di-unit-test.
 *
 * State: { v, convs: [conversation], activeId, error, lastSent }
 * Pesan yang dirender = rantai aktif conv aktif (lihat tree.js getActivePath).
 */

import {
  MSG_STATE,
  attachMessage,
  detachSubtree,
  fallbackTitle,
  newConversation,
  navigateBranch,
} from './tree.js'

const NO_OUTPUT_ERROR = 'Model tidak memberikan respons. Coba kirim ulang pertanyaannya.'

function patchConv(state, convId, fn) {
  return { ...state, convs: state.convs.map((c) => (c.id === convId ? fn(c) : c)) }
}

function setMessage(state, convId, msgId, fn) {
  return patchConv(state, convId, (c) => {
    const m = c.messages[msgId]
    if (!m) return c
    return { ...c, messages: { ...c.messages, [msgId]: fn(m) } }
  })
}

// Pengiriman gagal → judul skeleton berhenti pulsa, pakai fallback permanen.
function finalizeTitle(c) {
  if (!c.titlePending) return c
  const firstUser = Object.values(c.messages).find((m) => m.role === 'user')
  return { ...c, title: fallbackTitle(firstUser?.content || ''), titlePending: false }
}

export function chatReducer(state, action) {
  switch (action.type) {
    case 'NEW_CHAT':
      return { ...state, activeId: action.convId, error: null }

    case 'SELECT_CHAT':
      return { ...state, activeId: action.convId, error: null }

    // Muat detail percakapan dari server (list hanya metadata tanpa pohon pesan).
    case 'MERGE_CONV':
      if (!action.conv || !action.conv.id) return state
      return patchConv(state, action.conv.id, (c) =>
        action.conv.messages && typeof action.conv.messages === 'object'
          ? { ...c, ...action.conv }
          : c,
      )

    case 'START_SEND': {
      // userMsg + aiMsg dibuat di hook (ID deterministik untuk test), reducer
      // hanya menempelkannya ke pohon. Conv dibuat optimis: pengguna lihat
      // chat-nya langsung di sidebar meski respons belum tiba.
      // userMsg opsional: regenerate murni hanya menambah AI sibling.
      const { convId, userMsg, aiMsg } = action
      const attach = (c) => {
        let next = c
        if (userMsg) next = attachMessage(next, userMsg)
        if (aiMsg) next = attachMessage(next, aiMsg)
        return next
      }
      const existing = state.convs.find((c) => c.id === convId)
      if (existing) {
        return {
          ...patchConv(state, convId, attach),
          activeId: convId,
          error: null,
          lastSent: action.lastSent ?? (userMsg ? userMsg.content : state.lastSent),
        }
      }
      if (!userMsg) return state // regenerate di conv yang tidak ada = no-op
      const conv = newConversation(convId, { title: fallbackTitle(userMsg.content) })
      conv.titlePending = true
      return {
        ...state,
        convs: [...state.convs, attach(conv)],
        activeId: convId,
        error: null,
        lastSent: action.lastSent ?? userMsg.content,
      }
    }

    case 'STREAM_DELTA':
      // content akumulatif (api.js mengirim teks penuh per chunk)
      return setMessage(state, action.convId, action.msgId, (m) => ({
        ...m,
        content: action.content,
        state: MSG_STATE.STREAMING,
      }))

    case 'STREAM_DONE':
      return setMessage(state, action.convId, action.msgId, (m) => {
        const next = { ...m, state: MSG_STATE.DONE }
        if (typeof action.content === 'string' && action.content) next.content = action.content
        return next
      })

    case 'STREAM_EMPTY': {
      // Model selesai tanpa output (mis. budget token habis di reasoning):
      // buang bubble kosong + koreksi leaf, jangan tinggal pesan mati.
      const conv = state.convs.find((c) => c.id === action.convId)
      const convs = conv
        ? state.convs.map((c) =>
            c.id === action.convId ? finalizeTitle(detachSubtree(c, action.msgId)) : c,
          )
        : state.convs
      return { ...state, convs, error: NO_OUTPUT_ERROR }
    }

    case 'ABORT': {
      // Dihentikan sebelum token pertama → buang bubble kosong.
      if (!action.streamed) {
        return {
          ...patchConv(state, action.convId, (c) => finalizeTitle(detachSubtree(c, action.msgId))),
          error: null,
        }
      }
      // Sudah ada konten → simpan jawaban parsial, tandai 'aborted'.
      return setMessage(state, action.convId, action.msgId, (m) => ({
        ...m,
        state: MSG_STATE.ABORTED,
      }))
    }

    case 'STREAM_ERROR': {
      const error = action.error || 'Gagal mengirim pesan'
      if (!action.streamed) {
        // gagal sebelum konten: buang bubble, simpan lastSent untuk retry
        return {
          ...patchConv(state, action.convId, (c) => finalizeTitle(detachSubtree(c, action.msgId))),
          error,
        }
      }
      // gagal di tengah stream: konten parsial tetap tampak + state error
      return {
        ...setMessage(state, action.convId, action.msgId, (m) => ({ ...m, state: MSG_STATE.ERROR })),
        error,
      }
    }

    case 'SET_ERROR':
      return { ...state, error: action.error }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    case 'SET_TITLE':
      return patchConv(state, action.convId, (c) => ({
        ...c,
        title: action.title || c.title,
        titlePending: !!action.titlePending,
        // judul sukses/gagal tiba → berhenti pulsa skeleton
        ...(action.titlePending ? {} : { titlePending: false }),
      }))

    case 'PIN':
      return patchConv(state, action.convId, (c) => ({ ...c, pinned: !!action.pinned }))

    case 'RENAME':
      return patchConv(state, action.convId, (c) => ({
        ...c,
        title: action.title || c.title,
        titlePending: false,
      }))

    case 'NAVIGATE_BRANCH':
      return patchConv(state, action.convId, (c) => {
        const leaf = navigateBranch(c, action.msgId, action.dir)
        return leaf && leaf !== c.activeLeafId ? { ...c, activeLeafId: leaf } : c
      })

    case 'DELETE_CONV': {
      const convs = state.convs.filter((c) => c.id !== action.convId)
      const activeId = state.activeId === action.convId ? null : state.activeId
      return { ...state, convs, activeId, error: null }
    }

    case 'CLEAR_ALL':
      return { ...state, convs: [], activeId: null, error: null }

    // Undo penghapusan: snapshot pohon dikembalikan apa adanya.
    case 'RESTORE':
      return {
        ...state,
        convs: action.convs,
        activeId: action.activeId,
        error: null,
      }

    // Hydrate dari backend (D1) saat login: ganti seluruh state lokal.
    // dipakai useChatStore setelah fetchConversations sukses.
    case 'REPLACE_ALL': {
      const convs = Array.isArray(action.convs)
        ? action.convs.filter((c) => c && c.id && c.messages && typeof c.messages === 'object')
        : []
      const activeId = convs.some((c) => c.id === state.activeId)
        ? state.activeId
        : convs.length
          ? convs[0].id
          : null
      return { ...state, convs, activeId, error: null }
    }

    default:
      return state
  }
}
