import { useEffect, useRef, useState } from 'react'
import { Zap, Sparkles, Send } from 'lucide-react'

const USER_TXT = 'Jelaskan komputasi kuantum seolah aku anak kecil'
const AI_TXT =
  'Bayangkan koin yang berputar di udara — selama berputar, dia sekaligus ' +
  'gambar dan angka. Partikel kuantum juga begitu, sampai kamu melihatnya!'

// Demo looping: ketik pesan user → AI streaming per kata → jeda → ulangi.
// prefers-reduced-motion: langsung tampil penuh, tanpa loop.
function useDemo() {
  const [userLen, setUserLen] = useState(0)
  const [aiWords, setAiWords] = useState(0)
  const words = useRef(AI_TXT.split(' '))

  useEffect(() => {
    const full = { u: USER_TXT.length, w: words.current.length }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setUserLen(full.u)
      setAiWords(full.w)
      return
    }
    let alive = true
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    ;(async () => {
      while (alive) {
        setUserLen(0)
        setAiWords(0)
        await wait(700)
        for (let i = 0; i <= full.u && alive; i++) {
          setUserLen(i)
          await wait(34)
        }
        if (!alive) return
        await wait(550)
        for (let i = 0; i <= full.w && alive; i++) {
          setAiWords(i)
          await wait(110)
        }
        if (!alive) return
        await wait(4200)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return { userText: USER_TXT.slice(0, userLen), aiText: words.current.slice(0, aiWords).join(' ') }
}

export function ChatMock() {
  const { userText, aiText } = useDemo()
  const userDone = userText.length === USER_TXT.length
  const aiDone = aiText.length === AI_TXT.length

  return (
    <div className="relative animate-fade-up" style={{ animationDelay: '0.3s' }}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-foreground/5">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary">
              <Zap className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold text-foreground">KeyzAI</span>
          </div>
          <span className="w-12" aria-hidden="true" />
        </div>

        <div className="space-y-4 p-5">
          <div className="flex justify-end">
            <div
              className="max-w-[80%] whitespace-pre-wrap rounded-lg bg-primary px-3.5 py-2 text-sm text-primary-foreground"
              aria-label={USER_TXT}
            >
              {userText}
              {!userDone && !aiDone && (
                <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-primary-foreground/80 align-[-2px]" aria-hidden="true" />
              )}
            </div>
          </div>
          {(aiText || userDone) && (
            <div className="flex gap-2.5">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border">
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div
                className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-muted px-3.5 py-2 text-sm leading-relaxed text-foreground"
                aria-label={AI_TXT}
              >
                {aiText || (
                  <span className="inline-flex gap-1 align-middle" aria-hidden="true">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/50" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                  </span>
                )}
                {!aiDone && aiText && (
                  <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-muted-foreground/70 align-[-2px]" aria-hidden="true" />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5">
            <span className="flex-1 text-sm text-muted-foreground">Ada yang bisa dibantu?</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Send className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
