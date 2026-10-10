import { stamp } from '../../lib/session'

/**
 * The telemetry rail.
 *
 * A pinned column of session events: what happened, when, in what order. It is
 * the page's proof of mechanism — a visitor reads `edit.msg.02` followed by
 * `branch · 2 of 3` and knows the conversation is a tree before they read a
 * word of prose about it. Each event is two lines: the call, then its result,
 * which is how a log of this width stays legible without wrapping mid-value.
 *
 * On mobile it becomes a two-up list above the session body rather than a
 * column, so no event is ever clipped.
 */
const EVENTS = [
  { t: 2, key: 'open', value: 'session started' },
  { t: 3, key: 'auth.google', value: 'signed in' },
  { t: 4, key: 'models.load', value: '3 sources' },
  { t: 6, key: 'send', value: 'qwen3.8-flash' },
  { t: 6, key: 'stream', value: '1.4s to token' },
  { t: 19, key: 'edit.msg.02', value: 'prompt rewritten' },
  { t: 19, key: 'branch', value: '2 of 3', accent: true },
  { t: 21, key: 'regen', value: 'deepseek-v4-flash' },
  { t: 22, key: 'sync.d1', value: '3 branches' },
]

export function TelemetryRail({ clock, branches }) {
  return (
    <div className="log-rail lg:sticky lg:top-[60px] lg:h-[calc(100dvh-60px)] lg:overflow-hidden">
      {/* Rail header: what this column is, and that it is running. */}
      <div className="flex items-center justify-between gap-4 border-b border-foreground/10 px-5 py-4 lg:block lg:border-b-0 lg:px-6 lg:pt-7 lg:pb-4">
        <span className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span className="log-live size-1.5 shrink-0 rounded-full bg-yellow-400" aria-hidden="true" />
          Live session
        </span>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground lg:mt-2 lg:block">
          {stamp(clock)}
        </span>
      </div>

      {/* On a phone the rail carries only the tail of the log — edit, branch,
          regen, sync — which is the part that carries the mechanism. Nine
          events would push the offer most of a screen down. */}
      <ol className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 pb-5 sm:grid-cols-3 lg:absolute lg:inset-x-0 lg:top-[128px] lg:block lg:px-6 lg:pb-0">
        {EVENTS.map((e, i) => (
          <li
            key={e.key}
            data-lit={clock >= e.t ? '1' : '0'}
            data-accent={e.accent ? '1' : '0'}
            className={
              'log-ev min-w-0 font-mono text-[10.5px] leading-snug lg:py-[7px] ' +
              (i < 5 ? 'hidden lg:block' : '')
            }
          >
            <span className="flex items-baseline gap-2.5">
              <span className="w-[50px] shrink-0 tabular-nums opacity-80">{stamp(e.t)}</span>
              <span className="min-w-0 truncate font-medium">{e.key}</span>
            </span>
            <span className="mt-0.5 block pl-[60px] truncate opacity-80">{e.value}</span>
          </li>
        ))}
      </ol>

      {/* Rail footer: the two numbers the session ended on. */}
      <div className="hidden border-t border-foreground/10 px-6 py-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
        <dl className="flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          <div className="flex gap-2">
            <dt>first token</dt>
            <dd className="text-foreground">1.4s</dd>
          </div>
          <div className="flex gap-2">
            <dt>branches</dt>
            <dd className="text-yellow-400">{branches}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
