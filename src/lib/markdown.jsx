// Lightweight markdown renderer for chat bubbles — no external deps.
// Supports: **bold**, *italic*, `code`, fenced code blocks, headings,
// bullet/numbered lists (with nesting + wrapped continuation lines),
// blockquotes, tables (with column alignment), images, links,
// strikethrough, hr.
import React, { useMemo } from 'react'
import { CopyButton } from './copy-button'
import { OptionCard, OptionsPending } from '../components/OptionCard'
import { optionsLangState, parseOptionsPayload } from './options'

// Lookbehind unsupported in Safari < 16.4 — building at runtime with fallback
// avoids a SyntaxError that would crash the whole app on parse.
const INLINE_PATTERN =
  '(\\*\\*[^*\\s][^*]*\\*\\*|__[^_\\s][^_]*__|(?<![\\w*])\\*[^*\\s][^*]*\\*(?![\\w*])|(?<!\\w)_[^_\\s][^_]*_(?!\\w)|`[^`]+`|~~[^~]+~~|!\\[[^\\]]*\\]\\([^)\\s]+\\)|\\[[^\\]]+\\]\\([^)\\s]+\\))'
const INLINE_PATTERN_SAFE =
  '(\\*\\*[^*\\s][^*]*\\*\\*|__[^_\\s][^_]*__|\\*[^*\\s][^*]*\\*|_[^_\\s][^_]*_|`[^`]+`|~~[^~]+~~|!\\[[^\\]]*\\]\\([^)\\s]+\\)|\\[[^\\]]+\\]\\([^)\\s]+\\))'

function buildInlineRe() {
  try {
    return new RegExp(INLINE_PATTERN, 'g')
  } catch {
    return new RegExp(INLINE_PATTERN_SAFE, 'g')
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
        <code key={nodes.length} className="border border-foreground/20 bg-foreground/[0.05] px-1.5 py-px font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>
      )
    } else if (tok.startsWith('![')) {
      const im = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(tok)
      node = im && /^https?:\/\//i.test(im[2]) ? (
        <img key={nodes.length} src={im[2]} alt={im[1]} loading="lazy" className="my-1 block max-h-64 border border-border" />
      ) : im ? (
        im[1]
      ) : (
        tok
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
          className="font-medium underline underline-offset-2 decoration-muted-foreground/50 hover:decoration-foreground"
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
    <div className="overflow-hidden border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-1 font-mono">
        <span className="text-[11px] font-semibold lowercase tracking-wide text-muted-foreground">
          {lang || 'code'}
        </span>
        <CopyButton text={code} withLabel />
      </div>
      <pre className="overflow-x-auto bg-foreground/[0.03] p-3 text-[13px] leading-relaxed">
        <code className="font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}

const HR_RE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/
const HEADING_RE = /^(#{1,6})\s+(.*)$/
const LIST_ITEM_RE = /^(\s*)([-*•]|\d+[.)])\s+(.*)$/
const QUOTE_RE = /^\s*>\s?/
const TABLE_ROW_RE = /^\s*\|.*\|\s*$/
const TABLE_SEP_RE = /^\s*\|[\s:|-]+\|\s*$/
const FENCE_RE = /^\s*```/

function isBlockStart(line) {
  return (
    FENCE_RE.test(line) ||
    HEADING_RE.test(line) ||
    HR_RE.test(line) ||
    LIST_ITEM_RE.test(line) ||
    QUOTE_RE.test(line) ||
    TABLE_ROW_RE.test(line)
  )
}

function parseTable(rows) {
  const cells = (r) =>
    r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
  const sepRow = rows.find((r) => TABLE_SEP_RE.test(r))
  const aligns = sepRow
    ? cells(sepRow).map((c) => {
        const left = c.startsWith(':')
        const right = c.endsWith(':')
        return left && right ? 'center' : right ? 'right' : left ? 'left' : undefined
      })
    : []
  const dataRows = rows.filter((r) => !TABLE_SEP_RE.test(r))
  if (dataRows.length === 0) return null
  return { header: cells(dataRows[0]), body: dataRows.slice(1).map(cells), aligns }
}

// Build an indent-nested tree from flat list items, then render recursively.
function ListView({ items }) {
  const roots = []
  const stack = []
  for (const it of items) {
    const node = { ...it, children: [] }
    while (stack.length && stack[stack.length - 1].indent >= it.indent) stack.pop()
    if (stack.length === 0) roots.push(node)
    else stack[stack.length - 1].node.children.push(node)
    stack.push({ indent: it.indent, node })
  }

  const renderLevel = (nodes, depth) => {
    if (nodes.length === 0) return null
    const ordered = nodes[0].ordered
    const List = ordered ? 'ol' : 'ul'
    const listClass = ordered
      ? 'list-decimal ml-5 space-y-1 tabular-nums marker:text-muted-foreground'
      : depth === 0
        ? 'list-disc ml-5 space-y-1 marker:text-red-500'
        : 'ml-5 list-[square] space-y-1 marker:text-red-500/70'
    return (
      <List
        start={ordered ? nodes[0].start : undefined}
        className={listClass}
      >
        {nodes.map((n, j) => (
          <li key={j} className={`break-words pl-1 leading-relaxed ${n.task != null ? '-ml-5 list-none pl-0' : ''}`}>
            {n.task != null ? (
              <span className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center border text-[10px] leading-none ${
                    n.task ? 'border-red-500/60 bg-red-500/10 text-red-500' : 'border-foreground/25 text-transparent'
                  }`}
                >
                  {n.task ? '✓' : '·'}
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap">{renderInline([n.content, ...n.extra].join('\n'))}</span>
              </span>
            ) : (
              <span className="whitespace-pre-wrap">{renderInline([n.content, ...n.extra].join('\n'))}</span>
            )}
            {renderLevel(n.children, depth + 1)}
          </li>
        ))}
      </List>
    )
  }

  return renderLevel(roots, 0)
}

function collectList(lines, start) {
  const items = []
  let i = start
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '') {
      // loose list: keep going only if the next non-blank line is still a list item
      let j = i + 1
      while (j < lines.length && lines[j].trim() === '') j++
      if (j < lines.length && LIST_ITEM_RE.test(lines[j])) {
        i = j
        continue
      }
      break
    }
    const m = LIST_ITEM_RE.exec(line)
    if (m) {
      const ordered = /\d/.test(m[2])
      let content = m[3]
      let task = null
      if (!ordered) {
        const tm = /^\[([ xX])\]\s+(.*)$/.exec(content)
        if (tm) {
          task = tm[1].toLowerCase() === 'x'
          content = tm[2]
        }
      }
      items.push({
        indent: m[1].replace(/\t/g, '    ').length,
        ordered,
        start: ordered ? parseInt(m[2], 10) : undefined,
        content,
        task,
        extra: [],
      })
      i++
      continue
    }
    // wrapped continuation text belongs to the current item
    if (items.length > 0 && !isBlockStart(line)) {
      items[items.length - 1].extra.push(line.trim())
      i++
      continue
    }
    break
  }
  return { items, next: i }
}

function renderMarkdown(text, ctx = {}) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block — kecuali blok opsi interaktif dari model
    if (FENCE_RE.test(line)) {
      const lang = /^\s*```\s*([A-Za-z0-9+#._-]*)/.exec(line)?.[1] || ''
      const buf = []
      i++
      while (i < lines.length && !FENCE_RE.test(lines[i])) {
        buf.push(lines[i])
        i++
      }
      i++ // skip closing fence
      const raw = buf.join('\n')

      if (optionsLangState(lang)) {
        const payload = parseOptionsPayload(raw)
        if (payload) {
          blocks.push(<OptionCard key={key++} payload={payload} messageId={ctx.messageId} />)
        } else if (ctx.streaming) {
          // JSON belum utuh saat streaming — tampilkan skeleton, bukan dump mentah
          blocks.push(<OptionsPending key={key++} />)
        } else {
          blocks.push(<CodeBlock key={key++} code={raw} lang={lang} />)
        }
        continue
      }

      blocks.push(<CodeBlock key={key++} code={raw} lang={lang} />)
      continue
    }

    // Heading — diselaraskan ke ritme mono box AI (13px): H1 menonjol
    // dengan aksen merah, H2 uppercase, H3+ menyatu sebagai sublabel.
    const h = HEADING_RE.exec(line)
    if (h) {
      const depth = h[1].length
      const Tag = depth <= 1 ? 'h3' : depth === 2 ? 'h4' : 'h5'
      const cls =
        depth <= 1
          ? 'mt-3 border-b border-red-500/40 pb-1 text-[14px] font-bold tracking-tight text-foreground first:mt-0'
          : depth === 2
            ? 'mt-3 text-[13px] font-bold uppercase tracking-wide text-foreground first:mt-0'
            : 'mt-2 text-[13px] font-semibold text-muted-foreground first:mt-0'
      blocks.push(
        <Tag key={key++} className={cls}>
          {renderInline(h[2])}
        </Tag>
      )
      i++
      continue
    }

    // Horizontal rule
    if (HR_RE.test(line)) {
      blocks.push(<hr key={key++} className="my-3 border-foreground/15" />)
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
        <blockquote
          key={key++}
          className="space-y-1 border-l-2 border-red-500/40 bg-foreground/[0.03] py-1.5 pl-3 pr-3 text-muted-foreground"
        >
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
        const align = (j) => (table.aligns[j] ? { textAlign: table.aligns[j] } : undefined)
        blocks.push(
          <div key={key++} className="overflow-x-auto border border-border">
            <table className="w-full border-collapse font-mono text-[12px] leading-relaxed">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  {table.header.map((c, j) => (
                    <th key={j} style={align(j)} className="px-3 py-1.5 font-semibold text-foreground">
                      {renderInline(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.body.map((r, ri) => (
                  <tr key={ri} className="border-b border-border/60 last:border-0">
                    {r.map((c, ci) => (
                      <td key={ci} style={align(ci)} className="px-3 py-1.5">
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

    // Lists (nested, with continuation lines)
    if (LIST_ITEM_RE.test(line)) {
      const { items, next } = collectList(lines, i)
      i = next
      blocks.push(<ListView key={key++} items={items} />)
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

  return blocks
}

export function Markdown({ text = '', className = '', messageId = null, streaming = false }) {
  const blocks = useMemo(
    () => renderMarkdown(String(text), { messageId, streaming }),
    [text, messageId, streaming]
  )
  return <div className={`space-y-3 ${className}`}>{blocks}</div>
}
