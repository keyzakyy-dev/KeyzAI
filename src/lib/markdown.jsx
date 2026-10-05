// Lightweight markdown renderer for chat bubbles — no external deps.
// Supports: **bold**, *italic*, `code`, fenced code blocks, headings,
// bullet/numbered lists (with nesting + wrapped continuation lines),
// blockquotes, tables (with column alignment), images, links,
// strikethrough, hr.
import React, { useMemo } from 'react'
import { CopyButton } from './copy-button'
import { OptionCard, OptionsPending } from '../components/OptionCard'
import { optionsLangState, parseOptionsPayload } from './options'

// Inline tokens: bold, italic, code, strike, image, link (with optional
// title), autolink <https://...>, and bare https:// URLs.
const INLINE_PATTERN =
  '(\\*\\*[^*]+?\\*\\*|__[^_]+?__|(?<![\\w*])\\*[^*\\s][^*]*\\*(?![\\w*])|(?<!\\w)_[^_\\s][^_]*_(?!\\w)|`[^`\\n]+`|~~[^~\\n]+?~~|!\\[[^\\]]*\\]\\([^\\)]+\\)|\\[[^\\]]+\\]\\([^\\)]+\\)|<https?:\\/\\/[^>\\s]+>|https?:\\/\\/[^\\s<]+)'
const INLINE_PATTERN_SAFE =
  '(\\*\\*[^*]+?\\*\\*|__[^_]+?__|\\*[^*\\s][^*]*\\*|_[^_\\s][^_]*_|`[^`\\n]+`|~~[^~\\n]+?~~|!\\[[^\\]]*\\]\\([^\\)]+\\)|\\[[^\\]]+\\]\\([^\\)]+\\)|<https?:\\/\\/[^>\\s]+>|https?:\\/\\/[^\\s<]+)'

function buildInlineRe() {
  try {
    return new RegExp(INLINE_PATTERN, 'g')
  } catch {
    return new RegExp(INLINE_PATTERN_SAFE, 'g')
  }
}

const INLINE_RE = buildInlineRe()

function parseLinkTarget(inside) {
  const s = inside.trim()
  // URL with optional "title" or 'title' or (title)
  const m = /^(\S+)(?:\s+["'(](.*?)["')])?$/.exec(s)
  if (!m) return null
  return { url: m[1], title: m[2] || undefined }
}

function isSafeUrl(url) {
  if (!url) return false
  if (/^(https?:\/\/|mailto:)/i.test(url)) return true
  // Allow relative links and anchors: /docs, ./x, #section
  if (/^(?:\/|\.\.?\/|#[^:]*)[^:]*$/.test(url) && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return true
  return false
}

function stripTrailingPunct(url) {
  const m = /^(.*?)([.,;:!?]+)$/.exec(url)
  // Keep balanced parens: don't strip if it would unbalance
  if (m) {
    const open = (m[1].match(/\(/g) || []).length
    const close = (m[1].match(/\)/g) || []).length
    if (close < open) return { url, trail: '' }
    return { url: m[1], trail: m[2] }
  }
  if (url.endsWith(')') && (url.match(/\(/g) || []).length < (url.match(/\)/g) || []).length) {
    return { url: url.slice(0, -1), trail: ')' }
  }
  return { url, trail: '' }
}

function renderInline(text) {
  const nodes = []
  let last = 0
  let m
  const re = new RegExp(INLINE_RE.source, 'g')
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    const k = nodes.length
    let node
    if (tok.startsWith('**') || tok.startsWith('__')) {
      node = <strong key={k} className="font-semibold">{renderInline(tok.slice(2, -2))}</strong>
    } else if (tok.startsWith('~~')) {
      node = <del key={k}>{renderInline(tok.slice(2, -2))}</del>
    } else if (tok.startsWith('`')) {
      node = (
        <code key={k} className="rounded border border-foreground/20 bg-foreground/[0.05] px-1.5 py-px font-mono text-[0.85em] break-words">
          {tok.slice(1, -1)}
        </code>
      )
    } else if (tok.startsWith('![')) {
      const im = /^!\[([^\]]*)\]\((.+)\)$/.exec(tok)
      const t = im ? parseLinkTarget(im[2]) : null
      node = im && t && /^https?:\/\//i.test(t.url) ? (
        <img
          key={k}
          src={t.url}
          alt={im[1]}
          title={t.title}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
          className="my-1 block max-h-64 max-w-full border border-border object-contain"
        />
      ) : im && t ? (
        im[1]
      ) : (
        tok
      )
    } else if (tok.startsWith('[')) {
      const lm = /^\[([^\]]+)\]\((.+)\)$/.exec(tok)
      const t = lm ? parseLinkTarget(lm[2]) : null
      // Only safe URLs — prevents javascript:/data: injection
      node = lm && t && isSafeUrl(t.url) ? (
        <a
          key={k}
          href={t.url}
          title={t.title}
          target={/^https?:\/\//i.test(t.url) ? '_blank' : undefined}
          rel={/^https?:\/\//i.test(t.url) ? 'noreferrer noopener' : undefined}
          className="font-medium underline underline-offset-2 decoration-muted-foreground/50 hover:decoration-foreground break-words"
        >
          {renderInline(lm[1])}
        </a>
      ) : (
        tok
      )
    } else if (tok.startsWith('<http')) {
      const url = tok.slice(1, -1)
      node = (
        <a
          key={k}
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium underline underline-offset-2 decoration-muted-foreground/50 hover:decoration-foreground break-words"
        >
          {url}
        </a>
      )
    } else if (/^https?:\/\//i.test(tok)) {
      const { url, trail } = stripTrailingPunct(tok)
      node = (
        <span key={k}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium underline underline-offset-2 decoration-muted-foreground/50 hover:decoration-foreground break-words"
          >
            {url}
          </a>
          {trail}
        </span>
      )
    } else {
      node = <em key={k}>{renderInline(tok.slice(1, -1))}</em>
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
      <pre className="max-h-[420px] overflow-auto bg-foreground/[0.03] p-3 text-[13px] leading-relaxed">
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
  const splitCells = (r) => {
    // Split on unescaped pipes: \| stays as literal |
    const out = []
    let cur = ''
    for (let k = 0; k < r.length; k++) {
      const ch = r[k]
      if (ch === '\\' && r[k + 1] === '|') {
        cur += '|'
        k++
      } else if (ch === '|') {
        out.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
    out.push(cur)
    // Drop empty outer cells from leading/trailing pipes
    if (out.length && out[0].trim() === '') out.shift()
    if (out.length && out[out.length - 1].trim() === '') out.pop()
    return out.map((c) => c.trim().replace(/\\\|/g, '|'))
  }
  const sepIdx = rows.findIndex((r) => TABLE_SEP_RE.test(r))
  // A valid table needs header + separator + at least one body row
  if (sepIdx < 0 || rows.length < 2) return null
  const header = splitCells(rows[0])
  if (header.length === 0) return null
  const aligns = splitCells(rows[sepIdx]).map((c) => {
    const left = c.startsWith(':')
    const right = c.endsWith(':')
    return left && right ? 'center' : right ? 'right' : left ? 'left' : undefined
  })
  const bodyRows = rows.filter((_, idx) => idx !== sepIdx).slice(1)
  if (bodyRows.length === 0) return null
  const width = header.length
  const body = bodyRows.map((r) => {
    const cells = splitCells(r)
    // Normalize ragged rows to header width
    while (cells.length < width) cells.push('')
    return cells.slice(0, width)
  })
  return { header, body, aligns }
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
    // A level may mix `-` and `1.` items — group consecutive same-type
    // items so <ul> and <ol> are never forced onto the wrong items.
    const groups = []
    for (const n of nodes) {
      const g = groups[groups.length - 1]
      if (g && g.ordered === n.ordered) g.nodes.push(n)
      else groups.push({ ordered: n.ordered, start: n.start, nodes: [n] })
    }
    return (
      <>
        {groups.map((g, gi) => {
          const List = g.ordered ? 'ol' : 'ul'
          const listClass = g.ordered
            ? 'list-decimal ml-5 space-y-1 tabular-nums marker:text-muted-foreground'
            : depth === 0
              ? 'list-disc ml-5 space-y-1 marker:text-red-500'
              : 'ml-5 list-[square] space-y-1 marker:text-red-500/70'
          return (
            <List
              key={gi}
              start={g.ordered ? g.start : undefined}
              className={listClass}
            >
              {g.nodes.map((n, j) => (
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
                      <span className={`min-w-0 flex-1 whitespace-pre-wrap ${n.task ? 'line-through opacity-70' : ''}`}>{renderInline([n.content, ...n.extra].join('\n'))}</span>
                    </span>
                  ) : (
                    <span className="whitespace-pre-wrap">{renderInline([n.content, ...n.extra].join('\n'))}</span>
                  )}
                  {renderLevel(n.children, depth + 1)}
                </li>
              ))}
            </List>
          )
        })}
      </>
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

    // Heading — proper h1..h6 hierarchy with distinct scale inside
    // the 13px mono chat bubble.
    const h = HEADING_RE.exec(line)
    if (h) {
      const depth = Math.min(h[1].length, 6)
      const Tag = `h${depth}`
      const cls =
        depth === 1
          ? 'mt-4 border-b border-red-500/40 pb-1.5 text-[19px] font-extrabold tracking-tight text-foreground first:mt-0 scroll-mt-4 text-balance'
          : depth === 2
            ? 'mt-4 text-[16px] font-bold tracking-tight text-foreground first:mt-0 scroll-mt-4 text-balance'
            : depth === 3
              ? 'mt-3 text-[14px] font-bold tracking-tight text-foreground first:mt-0 scroll-mt-4 text-balance'
              : depth === 4
                ? 'mt-3 text-[13px] font-semibold uppercase tracking-wide text-foreground first:mt-0 scroll-mt-4'
                : 'mt-2 text-[13px] font-semibold text-muted-foreground first:mt-0 scroll-mt-4'
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
      blocks.push(<hr key={key++} className="my-4 border-t border-foreground/20" />)
      i++
      continue
    }

    // Blockquote (supports loose multi-paragraph quotes and >> nesting)
    if (QUOTE_RE.test(line)) {
      const buf = []
      while (i < lines.length) {
        if (QUOTE_RE.test(lines[i])) {
          buf.push(lines[i].replace(QUOTE_RE, ''))
          i++
        } else if (lines[i].trim() === '') {
          // Keep blank line only if quote continues afterwards
          let j = i + 1
          while (j < lines.length && lines[j].trim() === '') j++
          if (j < lines.length && QUOTE_RE.test(lines[j])) {
            buf.push('')
            i = j
          } else break
        } else break
      }
      blocks.push(
        <blockquote
          key={key++}
          className="space-y-1 border-l-2 border-red-500/40 bg-foreground/[0.03] py-1.5 pl-3 pr-3 text-muted-foreground"
        >
          {buf.map((l, j) =>
            l.trim() === '' ? (
              <div key={j} className="h-2" />
            ) : l.replace(/^\s*>\s?/, '').startsWith('>') || QUOTE_RE.test(`> ${l}`) && l.startsWith('>') ? (
              <p key={j} className="whitespace-pre-wrap border-l border-foreground/20 pl-2">
                {renderInline(l.replace(/^>\s?/, ''))}
              </p>
            ) : (
              <p key={j} className="whitespace-pre-wrap break-words">
                {renderInline(l)}
              </p>
            )
          )}
        </blockquote>
      )
      continue
    }

    // Table — requires header + separator + body, else falls back
    // to a plain paragraph so `|foo|` is not misrendered as a table.
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
                    <th key={j} style={align(j)} className="px-3 py-1.5 font-semibold text-foreground break-words">
                      {renderInline(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.body.map((r, ri) => (
                  <tr key={ri} className="border-b border-border/60 last:border-0 odd:bg-foreground/[0.02]">
                    {r.map((c, ci) => (
                      <td key={ci} style={align(ci)} className="px-3 py-1.5 break-words">
                        {renderInline(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      } else {
        // Not a real table — render lines as a paragraph
        blocks.push(
          <p key={key++} className="whitespace-pre-wrap break-words">
            {renderInline(rows.join('\n'))}
          </p>
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
