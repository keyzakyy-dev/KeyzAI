import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { KeyMark } from '../lib/key-mark'

const USER_TXT = 'Bikinin caption singkat buat foto kopi pagi'
const ANSWERS = [
  'Nikmatnya pagi, satu teguk sekaligus tenang. ☕',
  'Pagi ini punya saya: kopi hitam, sunyi, dan ide yang belum ditulis.',
]

// Demo cabang pesan: ketik → jawaban #1 stream → regenerate → jawaban #2
// stream → navigasi balik ke #1 → ulang. prefers-reduced-motion: tampil final.
function useDemo() {
  const [userLen, setUserLen] = useState(0)
  const [branch, setBranch] = useState(0)
  const [words, setWords] = useState(0)
  const wordLists = useRef(ANSWERS.map((a) => a.split(' ')))

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setUserLen(USER_TXT.length)
      setBranch(1)
      setWords(wordLists.current[1].length)
      return
    }
    let alive = true
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const stream = async (b) => {
      setBranch(b)
      setWords(0)
      await wait(700)
      for (let i = 0; i <= wordLists.current[b].length && alive; i++) {
        setWords(i)
        await wait(110)
      }
    }
    ;(async () => {
      const full = USER_TXT.length
      while (alive) {
        setUserLen(0)
        setWords(0)
        await wait(700)
        for (let i = 0; i <= full && alive; i++) {
          setUserLen(i)
          await wait(34)
        }
        if (!alive) return
        await wait(550)
        await stream(0)
        if (!alive) return
        await wait(1600)
        await stream(1)
        if (!alive) return
        await wait(1800)
        setBranch(0)
        setWords(wordLists.current[0].length)
        await wait(3400)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return {
    userText: USER_TXT.slice(0, userLen),
    typingUser: userLen < USER_TXT.length,
    answer: wordLists.current[branch].slice(0, words).join(' '),
    answerDone: words === wordLists.current[branch].length,
    branch,
  }
}

export function ChatMock() {
  const { userText, typingUser, answer, answerDone, branch } = useDemo()

  return (
    <div className="relative animate-fade-up" style={{ animationDelay: '0.3s' }}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-foreground/5">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          </div>
          <span className="flex-1" aria-hidden="true" />
          <span className="w-12" aria-hidden="true" />
        </div>

        <div className="min-h-[268px] space-y-4 p-5">
          <div className="flex justify-end">
            <div
              className="max-w-[80%] whitespace-pre-wrap rounded-lg bg-primary px-3.5 py-2 text-sm text-primary-foreground"
              aria-label={USER_TXT}
            >
              {userText}
              {typingUser && (
                <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-primary-foreground/80 align-[-2px]" aria-hidden="true" />
              )}
            </div>
          </div>

          {userText.length === USER_TXT.length && (
            <div className="flex gap-2.5">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border">
                <KeyMark className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="max-w-[85%] space-y-2">
                <div
                  className="whitespace-pre-wrap rounded-lg bg-muted px-3.5 py-2 text-sm leading-relaxed text-foreground"
                  aria-label={ANSWERS[branch]}
                >
                  {answer || (
                    <span className="inline-flex gap-1 align-middle" aria-hidden="true">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/50" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                    </span>
                  )}
                  {answer && !answerDone && (
                    <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-muted-foreground/70 align-[-2px]" aria-hidden="true" />
                  )}
                </div>

                {answerDone && (
                  <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground animate-fade-up">
                    <span className="inline-flex items-center gap-0.5 rounded-full border border-border bg-background px-1 py-0.5">
                      <ChevronLeft className={`h-3 w-3 ${branch === 0 ? 'opacity-30' : ''}`} />
                      <span className="font-medium tabular-nums">{branch + 1} / 2</span>
                      <ChevronRight className="h-3 w-3" />
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5">
                      <RotateCcw className="h-2.5 w-2.5" />
                      buat ulang
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
