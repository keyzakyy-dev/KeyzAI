import { useEffect, useState } from 'react'

/**
 * The session's own clock.
 *
 * Every log event on this page carries a timestamp, and a log whose clock is
 * frozen reads as a mockup. So the session starts at a fixed wall-clock time —
 * 09:41:02, the moment the first event fires — and ticks once a second: the
 * same seconds that light the gutter events in order. Under
 * `prefers-reduced-motion` the sequencing resolves immediately to its settled
 * state, but the clock still runs, because it is text rather than motion.
 */
const SESSION_EPOCH = 9 * 3600 + 41 * 60 + 2

export function useSessionClock({ startAt = SESSION_EPOCH } = {}) {
  const [seconds, setSeconds] = useState(startAt)

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return seconds
}

/** Seconds-since-session-start as the HH:MM:SS the gutter prints. */
export function stamp(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}
