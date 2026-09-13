// Lightweight markdown renderer for chat bubbles — no external deps.
// Supports: **bold**, *italic*, `code`, fenced code blocks, headings,
// bullet/numbered lists, blockquotes, tables, links, strikethrough, hr.
import React from 'react'
import { CopyButton } from './copy-button'

// Lookbehind unsupported in Safari < 16.4 — building at runtime with fallback
// avoids a SyntaxError that would crash the whole app on parse.
function buildInlineRe() {
  try {
    return new RegExp(
      '(\\*\\*[^*\\s][^*]*\\*\\*|__[^_\\s][^_]*__|(?<![\\w*])\\*[^*\\s][^*]*\\*(?![\\w*])|(?<!\\w)_[^_\\s][^_]*_(?!\\w)|`[^`]+`|~~[^~]+~~|\\[[^\\]]+\\]\\([^)\\s]+\\))',
      'g'
    )
  } catch {
    return /(\*\*[^*\s][^*]*\*\*|__[^_\s][^_]*__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|~~[^~]+~~|\[[^\]]+\]\([^)\s]+\))/g
  }
}

const INLINE_RE = buildInlineRe()

function renderInline(text) {
  const nodes = []
  let last = 0
  let m
  const re = new RegExp(INLINE_RE.source, 'g')
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    let node
    if (tok.startsWith('**') || tok.startsWith('__')) {
      node = <strong key={nodes.length} className="font-semibold">{tok.slice(2, -2)}</strong>
    } else if (tok.startsWith('~~')) {
      node = <s key={nodes.length}>{tok.slice(2, -2)}</s>
    } else if (tok.startsWith('`')) {
      node = (
        <code key={nodes.length} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>
      )
    } else if (tok.startsWith('[')) {
      const lm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok)
      // Only http(s)/mailto links — prevents javascript: URL injection
      node = lm && /^(https?:\/\/|mailto:)/i.test(lm[2]) ? (
        <a
          key={nodes.length}
          href={lm[2]}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
        >
          {lm[1]}
        </a>
      ) : (
        tok
      )
    } else {
      node = <em key={nodes.length}>{tok.slice(1, -1)}</em>
    }
    nodes.push(node)
    last = re.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function CodeBlock({ code, lang }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {lang || 'code'}
        </span>
        <CopyButton text={code} withLabel />
      </div>
      <pre className="overflow-x-auto bg-muted/50 p-3 text-xs leading-relaxed">
        <code className="font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}

const HR_RE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/
const HEADING_RE = /^(#{1,6})\s+(.*)$/
const UL_RE = /^\s*[-*•]\s+/
const OL_RE = /^\s*\d+[.)]\s+/
const QUOTE_RE = /^\s*>\s?/
const TABLE_ROW_RE = /^\s*\|.*\|\s*$/
const TABLE_SEP_RE = /^\s*\|[\s:|-]+\|\s*$/
const FENCE_RE = /^\s*```/

function isBlockStart(line) {
  return (
    FENCE_RE.test(line) ||
    HEADING_RE.test(line) ||
    HR_RE.test(line) ||
    UL_RE.test(line) ||
    OL_RE.test(line) ||
    QUOTE_RE.test(line) ||
    TABLE_ROW_RE.test(line)
  )
}

function parseTable(rows) {
  const cells = (r) =>
    r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
  const dataRows = rows.filter((r) => !TABLE_SEP_RE.test(r))
  if (dataRows.length === 0) return null
  return { header: cells(dataRows[0]), body: dataRows.slice(1).map(cells) }
}

export function Markdown({ text = '', className = '' }) {
  const lines = String(text).split('\n')
  const blocks = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (FENCE_RE.test(line)) {
      const lang = /^\s*```\s*([A-Za-z0-9+#._-]*)/.exec(line)?.[1] || ''
      const buf = []
      i++
      while (i < lines.length && !FENCE_RE.test(lines[i])) {
        buf.push(lines[i])
        i++
      }
      i++ // skip closing fence
      blocks.push(<CodeBlock key={key++} code={buf.join('\n')} lang={lang} />)
      continue
    }

    // Heading
    const h = HEADING_RE.exec(line)
    if (h) {
      const size = h[1].length <= 1 ? 'text-base' : h[1].length === 2 ? 'text-[15px]' : 'text-sm'
      blocks.push(
        <p key={key++} className={`${size} font-semibold`}>
          {renderInline(h[2])}
        </p>
      )
      i++
      continue
    }

    // Horizontal rule
    if (HR_RE.test(line)) {
      blocks.push(<hr key={key++} className="border-border" />)
      i++
      continue
    }

    // Blockquote
    if (QUOTE_RE.test(line)) {
      const buf = []
      while (i < lines.length && QUOTE_RE.test(lines[i])) {
        buf.push(lines[i].replace(QUOTE_RE, ''))
        i++
      }
      blocks.push(
        <blockquote key={key++} className="space-y-1 border-l-2 border-border pl-3 text-muted-foreground">
          {buf.map((l, j) => (
            <p key={j} className="whitespace-pre-wrap">
              {renderInline(l)}
            </p>
          ))}
        </blockquote>
      )
      continue
    }

    // Table
    if (TABLE_ROW_RE.test(line)) {
      const rows = []
      while (i < lines.length && TABLE_ROW_RE.test(lines[i])) {
        rows.push(lines[i])
        i++
      }
      const table = parseTable(rows)
      if (table) {
        blocks.push(
          <div key={key++} className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border">
                  {table.header.map((c, j) => (
                    <th key={j} className="px-2 py-1 font-semibold">
                      {renderInline(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.body.map((r, ri) => (
                  <tr key={ri} className="border-b border-border/60">
                    {r.map((c, ci) => (
                      <td key={ci} className="px-2 py-1">
                        {renderInline(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    // Unordered list
    if (UL_RE.test(line)) {
      const items = []
      while (i < lines.length && UL_RE.test(lines[i])) {
        items.push(lines[i].replace(UL_RE, ''))
        i++
      }
      blocks.push(
        <ul key={key++} className="ml-4 list-disc space-y-1">
          {items.map((it, j) => (
            <li key={j} className="whitespace-pre-wrap break-words">
              {renderInline(it)}
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list
    if (OL_RE.test(line)) {
      const items = []
      while (i < lines.length && OL_RE.test(lines[i])) {
        items.push(lines[i].replace(OL_RE, ''))
        i++
      }
      blocks.push(
        <ol key={key++} className="ml-4 list-decimal space-y-1">
          {items.map((it, j) => (
            <li key={j} className="whitespace-pre-wrap break-words">
              {renderInline(it)}
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Blank line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph: join consecutive plain lines
    const buf = [line]
    i++
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
      buf.push(lines[i])
      i++
    }
    blocks.push(
      <p key={key++} className="whitespace-pre-wrap break-words">
        {renderInline(buf.join('\n'))}
      </p>
    )
  }

  return <div className={`space-y-2 ${className}`}>{blocks}</div>
}
