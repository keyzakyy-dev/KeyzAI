import { useEffect, useState } from 'react'

/**
 * Log primitives.
 *
 * Everything the landing page draws is one of four things: a rule, a key, a
 * value, or prose. These components are those four things, so a new log block
 * is written in the same vocabulary as every other one instead of inventing
 * its own container.
 */

/** A hairline that draws itself once, when its log line arrives. */
export function Rule({ delay = 0, className = '', accent = false }) {
  return (
    <span
      aria-hidden="true"
      className={`log-rule block h-px w-full ${accent ? 'bg-yellow-400' : 'bg-foreground/15'} ${className}`}
      style={{ '--log-delay': `${delay}ms` }}
    />
  )
}

/** A mono event key: `send`, `branch`, `sync.d1`. The log's own vocabulary. */
export function EventKey({ children, delay = 0, accent = false, className = '' }) {
  return (
    <span
      className={`log-fade font-mono text-[10px] font-medium uppercase tracking-[0.14em] ${
        accent ? 'text-yellow-400' : 'text-muted-foreground'
      } ${className}`}
      style={{ '--log-delay': `${delay}ms` }}
    >
      {children}
    </span>
  )
}

/** A mono data value, tabular so columns of them line up. */
export function LogValue({ children, delay = 0, accent = false, className = '' }) {
  return (
    <span
      className={`log-fade font-mono text-[11px] tabular-nums ${
        accent ? 'text-yellow-400' : 'text-foreground/80'
      } ${className}`}
      style={{ '--log-delay': `${delay}ms` }}
    >
      {children}
    </span>
  )
}

/** Session prose — Inter, never mono. Mono is for keys, data and code. */
export function LogProse({ as: Tag = 'p', delay = 0, className = '', children }) {
  return (
    <Tag
      className={`log-fade text-[15px] leading-relaxed text-muted-foreground ${className}`}
      style={{ '--log-delay': `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}
