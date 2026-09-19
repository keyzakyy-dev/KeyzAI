import { useCallback, useRef } from 'react'
import { sendMessageStream, generateTitle } from '../api.js'
import { newId } from '../state/ids.js'
import { getContextFromAnchor, newMessage } from '../state/tree.js'

/**
 * Orkestrasi pengiriman pesan. Semua mutasi lewat dispatch (reducer murni);
 * hook ini hanya mengatur lifecycle async: dispatch START_SEND → delta →
 * done/empty/abort/error, lalu judul untuk percakapan baru.
 *
 * mode:
 *  - 'new'        : pesan user baru (atau lanjutan percakapan)
 *  - 'edit'       : ganti pesan user lama → sibling baru + AI baru
 *  - 'regenerate' : AI baru sebagai sibling jawaban lama (tanpa pesan user baru)
 */
export function useChatStream({ state, dispatch, loading }) {
  const busyRef = useRef(null) // AbortController untuk generasi yang berjalan

  const send = useCallback(
    async ({ content, mode = 'new', editTargetId = null, regenerateFromId = null, model, convId: convIdArg } = {}) => {
      if (busyRef.current) return // generasi lain sedang jalan

      // convId bisa ditentukan pemanggil (mis. auto-send ?q= butuh chat baru
      // yang belum ada di store); jika tidak, lanjutkan percakapan aktif.
      const convId = convIdArg || state.activeId || newId('conv')
      const conv = state.convs.find((c) => c.id === convId) || null
      const now = Math.floor(Date.now() / 1000)

      let userMsg = null
      let aiMsg
      let context
      let titleSource = content

      if (mode === 'regenerate') {
        const userOld = conv?.messages?.[regenerateFromId]
        if (!userOld) return
        aiMsg = newMessage({
          id: newId('msg'),
          role: 'assistant',
          content: '',
          timestamp: now + 1,
          parentId: regenerateFromId,
        })
        context = getContextFromAnchor(conv, regenerateFromId, 20)
        titleSource = userOld.content
        dispatch({ type: 'START_SEND', convId, userMsg: null, aiMsg, lastSent: userOld.content })
      } else if (mode === 'edit') {
        const target = conv?.messages?.[editTargetId]
        if (!target) return
        userMsg = newMessage({
          id: newId('msg'),
          role: 'user',
          content,
          timestamp: now,
          parentId: target.parentId,
        })
        aiMsg = newMessage({
          id: newId('msg'),
          role: 'assistant',
          content: '',
          timestamp: now + 1,
          parentId: userMsg.id,
        })
        context = [...getContextFromAnchor(conv, target.parentId, 20), { role: 'user', content }]
        dispatch({ type: 'START_SEND', convId, userMsg, aiMsg })
      } else {
        const anchorId = conv ? conv.activeLeafId : null
        userMsg = newMessage({
          id: newId('msg'),
          role: 'user',
          content,
          timestamp: now,
          parentId: anchorId,
        })
        aiMsg = newMessage({
          id: newId('msg'),
          role: 'assistant',
          content: '',
          timestamp: now + 1,
          parentId: userMsg.id,
        })
        context = [...getContextFromAnchor(conv, anchorId, 20), { role: 'user', content }]
        dispatch({ type: 'START_SEND', convId, userMsg, aiMsg })
      }

      const wasNewConversation = !conv
      const controller = new AbortController()
      busyRef.current = controller
      let streamed = false
      const startedAt = Date.now()

      try {
        const text = await sendMessageStream(
          titleSource,
          (partial) => {
            streamed = true
            dispatch({ type: 'STREAM_DELTA', convId, msgId: aiMsg.id, content: partial })
          },
          controller.signal,
          model,
          context,
        )

        if (!text) {
          // Model selesai tanpa output (mis. budget habis di reasoning).
          dispatch({ type: 'STREAM_EMPTY', convId, msgId: aiMsg.id })
          return
        }

        dispatch({ type: 'STREAM_DONE', convId, msgId: aiMsg.id, content: text, genMs: Date.now() - startedAt })

        // Judul hanya untuk percakapan baru — yang lama sudah punya judul.
        if (wasNewConversation) {
          generateTitle(titleSource, text, model)
            .then((t) => dispatch({ type: 'SET_TITLE', convId, title: t, titlePending: false }))
            .catch(() => dispatch({ type: 'SET_TITLE', convId, title: null, titlePending: false }))
        }
      } catch (err) {
        const aborted = err.name === 'AbortError'
        if (aborted) {
          dispatch({ type: 'ABORT', convId, msgId: aiMsg.id, streamed })
        } else {
          dispatch({ type: 'STREAM_ERROR', convId, msgId: aiMsg.id, error: err.message, streamed })
        }
      } finally {
        busyRef.current = null
      }
    },
    [state, dispatch],
  )

  const stop = useCallback(() => {
    busyRef.current?.abort()
  }, [])

  return { send, stop, loading }
}
