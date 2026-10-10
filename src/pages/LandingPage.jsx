import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { usePageMeta, SITE_NAME, SITE_DESC } from '../lib/seo'
import { MODELS } from '../lib/models'
import { useSessionClock } from '../lib/session'
import { SessionNav } from '../components/landing/SessionNav'
import { TelemetryRail } from '../components/landing/TelemetryRail'
import { EventKey, LogValue, LogProse } from '../components/landing/LogPrimitives'

/* ─── Session open ───────────────────────────────────────────────────────── */

function SessionOpen({ navigate }) {
  const clock = useSessionClock()

  return (
    <section id="top" className="scroll-mt-[60px]" aria-labelledby="session-offer">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] xl:grid-cols-[248px_1fr]">
        <TelemetryRail clock={clock} branches={3} />

        <div className="px-5 pb-20 pt-8 sm:px-8 sm:pb-24 sm:pt-12 lg:px-12 lg:pb-28 lg:pt-14">
          {/* The block header: what this session is, in the log's own record. */}
          <div className="log-fade mb-7 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-foreground/12 pb-3">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              session · keyzai
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              3 sources resolved · google auth · d1 sync on
            </span>
          </div>

          {/* The prompt that opened the session. */}
          <div className="log-fade flex items-baseline gap-3" style={{ '--log-delay': '60ms' }}>
            <span className="font-mono text-[12px] text-foreground" aria-hidden="true">
              &gt;
            </span>
            <p className="font-mono text-[13px] leading-relaxed text-foreground sm:text-[13.5px]">
              <span className="text-yellow-400">you</span>
              <span className="text-muted-foreground"> · </span>
              draft the intro to my landing page — three angles, no adjectives I can&apos;t prove
            </p>
          </div>

          {/* The answer, arriving. The pane spans the session; its prose keeps
              the reading measure, so the log reads as one instrument. */}
          <article
            className="log-fade mt-6 border border-foreground/15 bg-card"
            style={{ '--log-delay': '140ms' }}
          >
            <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-foreground/10 px-5 py-3">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                assistant
              </span>
              <span className="border border-foreground/15 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                qwen3.8-flash
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-yellow-400">
                <span className="log-live size-1.5 rounded-full bg-yellow-400" aria-hidden="true" />
                streaming
              </span>
              <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground">
                msg 02 · branch 2
              </span>
            </header>

            <div className="px-5 py-6 sm:px-7 sm:py-7">
              <p className="max-w-[68ch] text-[15px] leading-[1.7] text-foreground/90 sm:text-base">
                Three angles, ranked by how much each one asks of the reader.
              </p>

              <ol className="mt-5 max-w-[68ch] space-y-4">
                {[
                  {
                    n: '1',
                    lead: 'Tree, not thread.',
                    body: ' Every other chat keeps one linear log. Edit a message here and regenerate forward — the old answer stays, and so does every path you took to it.',
                  },
                  {
                    n: '2',
                    lead: 'One workspace, three models.',
                    body: ' Switch mid-sentence. Nothing is lost in the switch, because nothing was ever overwritten.',
                  },
                  {
                    n: '3',
                    lead: 'Free without a card.',
                    body: ' Sign in with Google and start. That is the whole onboarding.',
                  },
                ].map((a, i) => (
                  <li
                    key={a.n}
                    className="log-fade flex gap-4"
                    style={{ '--log-delay': `${280 + i * 170}ms` }}
                  >
                    <span className="mt-[3px] font-mono text-[11px] tabular-nums text-yellow-400">
                      {a.n}
                    </span>
                    <p className="text-[15px] leading-[1.7] text-muted-foreground">
                      <span className="font-medium text-foreground">{a.lead}</span>
                      {a.body}
                    </p>
                  </li>
                ))}
              </ol>

              <p
                className="log-fade mt-6 max-w-[68ch] text-[15px] leading-[1.7] text-muted-foreground sm:text-base"
                style={{ '--log-delay': '820ms' }}
              >
                You edited message 02 while I was writing, so this is branch 2 of 3 — the first
                take is one click back.
                <span className="log-caret ml-1" aria-hidden="true" />
                <span className="sr-only">Response still streaming.</span>
              </p>
            </div>
          </article>

          {/* The branch event: the differentiator, stated as a logged fact. */}
          <div
            className="log-fade relative mt-5 border border-foreground/15 bg-card/40 py-3 pl-5 pr-4"
            style={{ '--log-delay': '980ms' }}
          >
            <span
              className="log-branch-rule absolute inset-y-0 left-0 w-[2px] bg-yellow-400"
              style={{ '--log-delay': '980ms' }}
              aria-hidden="true"
            />
            <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 font-mono text-[11.5px] leading-relaxed">
              <span className="font-medium uppercase tracking-[0.14em] text-yellow-400">branch</span>
              <span className="text-foreground">2 of 3</span>
              <span className="text-muted-foreground">
                message 02 edited &ldquo;tighten the intro&rdquo; — original kept, both synced to D1
              </span>
            </p>
          </div>

          {/* The resolution: the offer, as the session's conclusion. */}
          <div className="mt-12 border-t border-foreground/15 pt-10 sm:mt-14 sm:pt-11">
            <h1
              id="session-offer"
              className="log-fade max-w-[16ch] font-heading text-[2.75rem] font-medium leading-[1.02] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-[4.25rem]"
              style={{ '--log-delay': '1140ms' }}
            >
              Every model.{' '}
              <span className="text-yellow-400">One tree.</span>
            </h1>

            <div className="mt-9 grid gap-9 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-14">
              <LogProse delay={1260} className="max-w-[52ch]">
                Chat, code and PRDs in one workspace. Edit any message and regenerate forward — the
                conversation branches instead of breaking, and every branch is still there on the
                device you open next.
              </LogProse>

              <div className="log-fade lg:text-right" style={{ '--log-delay': '1360ms' }}>
                <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
                  <button
                    type="button"
                    onClick={() => navigate('/chat')}
                    className="group inline-flex h-12 items-center justify-center gap-2 bg-foreground px-5 font-mono text-[13px] font-semibold text-background transition-transform hover:-translate-y-0.5"
                  >
                    Open chat
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                  <a
                    href="#prd-run"
                    className="inline-flex h-12 items-center justify-center border border-foreground/20 px-5 font-mono text-[12px] font-medium text-foreground transition-colors hover:border-foreground/45"
                  >
                    From idea to PRD
                  </a>
                </div>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80 lg:mt-4">
                  Free · Google sign-in · synced
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Channels ───────────────────────────────────────────────────────────── */

/**
 * Five channels, measured.
 *
 * A measurement strip, not a card grid: each row is a hairline carrying a
 * channel key, its level and one line of what it does. Every row shares the
 * log's grid, so the eye reads one instrument rather than five competing
 * boxes — and the strip's density is deliberately unlike the session above it,
 * which is what gives the scroll its pacing.
 */
const CHANNELS = [
  {
    key: 'chat',
    level: 8.2,
    title: 'Streamed conversation',
    body: 'Responses arrive as they are written. Stop mid-answer when you have read enough — the partial text is what gets saved.',
  },
  {
    key: 'code',
    level: 6.4,
    title: 'Code and debugging',
    body: 'Paste the stack trace, describe the bug, get the fix. Argue with it in the next branch when it is wrong.',
  },
  {
    key: 'write',
    level: 7.1,
    title: 'Drafting',
    body: 'Emails, specs, documentation. Adjust tone and length without discarding the version that was nearly right.',
  },
  {
    key: 'think',
    level: 9.0,
    title: 'Deep reasoning',
    body: 'Route a hard question to DeepSeek V4 Flash mid-thread and keep both answers side by side in the tree.',
  },
  {
    key: 'sync',
    level: null,
    title: 'Cross-device sync',
    body: 'Sign in with Google. Every branch lands in your account, so the conversation on your phone is the one you left.',
  },
]

function ChannelsBlock() {
  return (
    <section
      id="channels"
      data-log-block=""
      className="scroll-mt-[60px] border-t border-foreground/15"
      aria-labelledby="channels-title"
    >
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <BlockHead
          rule="# channels"
          title="Five channels, one tree"
          lede="The same workspace serves each kind of work, and every one of them branches the same way. Pick the channel; the conversation still belongs to you."
          titleId="channels-title"
        />

        <div className="mt-14 border-t border-foreground/15 sm:mt-16">
          {CHANNELS.map((c, i) => (
            <div
              key={c.key}
              className="log-row group grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-2 border-b border-foreground/12 px-1 py-6 sm:grid-cols-[104px_104px_1fr] sm:gap-x-8 sm:py-7"
            >
              <EventKey delay={i * 90}>{c.key}</EventKey>

              {/* Level: a bar the reader can compare down the column. */}
              <div className="col-start-2 row-start-1 flex items-center gap-2.5 sm:col-start-auto sm:row-start-auto">
                {c.level == null ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-yellow-400">
                    always on
                  </span>
                ) : (
                  <>
                    <span className="h-[3px] w-16 bg-foreground/15 sm:w-20">
                      <span
                        className="log-bar-fill block h-full bg-foreground/75"
                        style={{
                          width: `${(c.level / 10) * 100}%`,
                          '--log-delay': `${200 + i * 90}ms`,
                        }}
                      />
                    </span>
                    <LogValue delay={260 + i * 90}>{c.level.toFixed(1)}</LogValue>
                  </>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1">
                <h3 className="text-[17px] font-medium text-foreground">{c.title}</h3>
                <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground">
                  {c.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── PRD run ────────────────────────────────────────────────────────────── */

const PRD_STEPS = [
  {
    key: 'ideation',
    label: 'Ideation',
    out: 'concept captured',
    body: 'Describe the idea in plain language. No template, no fields to fill in first.',
  },
  {
    key: 'clarify',
    label: 'Clarify',
    out: 'gaps resolved',
    body: 'The model asks the questions that decide scope and waits for your answer before drafting anything.',
  },
  {
    key: 'stack',
    label: 'Tech stack',
    out: 'recommendations issued',
    body: 'Technologies proposed against your constraints, with the reasoning left in the document.',
  },
  {
    key: 'structure',
    label: 'Structure',
    out: 'feature map built',
    body: 'Hierarchy, flows and edge cases laid out as an architecture map you can navigate.',
  },
  {
    key: 'prd',
    label: 'PRD',
    out: 'document ready',
    body: 'A complete requirements document. Every section stays editable — it is a draft, not a verdict.',
  },
]

/** The artifact the run produces: a real document outline, not a skeleton. */
const PRD_SECTIONS = [
  ['1', 'Summary', '142'],
  ['2', 'Goals & non-goals', '96'],
  ['3', 'User stories', '218'],
  ['4', 'Tech stack', '74'],
  ['5', 'Architecture', '184'],
  ['6', 'Milestones', '88'],
  ['7', 'Risks', '62'],
]

function PrdRunBlock({ navigate }) {
  return (
    <section
      id="prd-run"
      data-log-block=""
      className="scroll-mt-[60px] border-t border-foreground/15"
      aria-labelledby="prd-title"
    >
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <BlockHead
          rule="# prd.run"
          title="An idea, run to a document"
          lede="A second mode of the same workspace. Same tree, same sync — it just keeps asking you questions until the thing is specified."
          titleId="prd-title"
          badge="Beta"
        />

        {/* The run, then the document it produced. */}
        <div className="mt-14 grid gap-12 sm:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-16">
          <ol className="border-t border-foreground/15">
            {PRD_STEPS.map((s, i) => (
              <li key={s.key} className="border-b border-foreground/12 py-5 sm:py-6">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <EventKey delay={i * 80}>{s.key}</EventKey>
                  <span className="text-[15px] font-medium text-foreground">{s.label}</span>
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground/70">
                    {s.out}
                  </span>
                </div>
                <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-muted-foreground sm:pl-[7.6rem]">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="lg:pt-1">
            <div className="border border-foreground/15 bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-foreground/10 px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  prd.md
                </span>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  864 words
                </span>
              </div>

              <ul className="px-4 py-3">
                {PRD_SECTIONS.map(([n, name, words], i) => (
                  <li
                    key={n}
                    className="log-fade flex items-baseline gap-3 border-b border-foreground/8 py-2 last:border-b-0"
                    style={{ '--log-delay': `${220 + i * 70}ms` }}
                  >
                    <span className="font-mono text-[10px] tabular-nums text-yellow-400/90">
                      {n}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground/85">
                      {name}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                      {words}w
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-foreground/10 px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => navigate('/prd-builder')}
                  className="group inline-flex h-10 w-full items-center justify-center gap-2 bg-foreground font-mono text-[12px] font-semibold text-background transition-transform hover:-translate-y-0.5"
                >
                  Run it yourself
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Sources ────────────────────────────────────────────────────────────── */

function SourcesBlock() {
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(null), 1600)
    return () => clearTimeout(id)
  }, [copied])

  const copy = (id) => {
    navigator.clipboard?.writeText(id).then(
      () => setCopied(id),
      () => setCopied(null)
    )
  }

  return (
    <section
      id="sources"
      data-log-block=""
      className="scroll-mt-[60px] border-t border-foreground/15"
      aria-labelledby="sources-title"
    >
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <BlockHead
          rule="# sources"
          title="Every model, zero cost"
          lede="Three sources are live and free. Switch between them at any point in a conversation — the tree keeps both answers."
          titleId="sources-title"
        />

        <div className="mt-14 border-t border-foreground/15 sm:mt-16">
          {MODELS.map((m) => (
            <div
              key={m.id}
              className="log-row grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3 border-b border-foreground/12 px-1 py-5 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:gap-x-8 sm:py-6"
            >
              <img src={m.logo} alt="" className="size-9 shrink-0 object-contain sm:size-10" />

              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-[17px] font-medium text-foreground">{m.label}</h3>
                  <span className="font-mono text-[11px] text-muted-foreground">{m.provider}</span>
                  {m.isNew && (
                    <span className="border border-yellow-400/40 px-1.5 py-px font-mono text-[10px] uppercase tracking-[0.12em] text-yellow-400">
                      New
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <code className="font-mono text-[11px] text-muted-foreground/80">{m.id}</code>
                  <span className="text-[14px] text-muted-foreground">{m.taglineEn}</span>
                </div>
              </div>

              <div className="col-start-2 flex items-center gap-3 sm:col-start-auto">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-yellow-400">
                  Free
                </span>
                <button
                  type="button"
                  onClick={() => copy(m.id)}
                  className="inline-flex h-8 items-center gap-1.5 border border-foreground/15 px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                  aria-label={`Copy model ID ${m.id}`}
                >
                  {copied === m.id ? (
                    <>
                      <Check className="size-3 text-yellow-400" strokeWidth={2.5} aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    'Copy id'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Block head ─────────────────────────────────────────────────────────── */

/**
 * The log's block header. The rule name (`# channels`) is the record separator
 * the session would have written when the block started — the heading itself
 * carries the weight, with no eyebrow above it.
 */
function BlockHead({ rule, title, titleId, lede, badge }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,44ch)] lg:items-end lg:gap-16">
      <div>
        <div className="flex items-center gap-3">
          <EventKey>{rule}</EventKey>
          {badge && (
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-yellow-400">
              <span className="size-1.5 rounded-full bg-yellow-400" aria-hidden="true" />
              {badge}
            </span>
          )}
        </div>
        <h2
          id={titleId}
          className="mt-5 max-w-[18ch] font-heading text-[2rem] font-medium leading-[1.08] tracking-[-0.03em] text-foreground sm:text-[2.5rem]"
        >
          {title}
        </h2>
      </div>
      <LogProse className="max-w-[46ch] lg:pb-2">{lede}</LogProse>
    </div>
  )
}

/* ─── Session close ──────────────────────────────────────────────────────── */

const CLOSE_LINKS = [
  { to: '/chat', label: 'Open chat' },
  { to: '/prd-builder', label: 'PRD Builder', chip: 'Beta' },
  { to: '/changelog', label: 'Changelog' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
]

function SessionClose({ navigate }) {
  return (
    <footer className="border-t border-foreground/15">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
        {/* The log closes on its own line, the way a session does. */}
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-foreground/12 pb-6">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            session closed
          </span>
          <span className="font-mono text-[11px] text-muted-foreground/70">
            nothing charged · no card on file
          </span>
        </div>

        <div className="flex flex-col gap-8 pt-8 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-[38ch] text-[14px] leading-relaxed text-muted-foreground">
            KeyzAI — every major AI model, free. Chat, code and PRDs in one workspace.
          </p>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-4">
            {CLOSE_LINKS.map((l) => (
              <a
                key={l.to}
                href={l.to}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(l.to)
                }}
                className="inline-flex min-h-[36px] items-center gap-2 px-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
                {l.chip && (
                  <span className="border border-yellow-400/40 px-1 py-px text-[9px] text-yellow-400">
                    {l.chip}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>

        <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          © 2026 KeyzAI · by{' '}
          <a
            href="https://github.com/keyzakyy-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[24px] items-center text-foreground transition-colors hover:text-yellow-400"
          >
            Keyzakyy
          </a>
        </p>
      </div>
    </footer>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export function LandingPage() {
  const navigate = useNavigate()
  usePageMeta({ title: SITE_NAME, description: SITE_DESC, path: '/' })

  useEffect(() => {
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is KeyzAI free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. KeyzAI is free with no credit card required. Sign in with Google and start chatting with any available model.',
          },
        },
        {
          '@type': 'Question',
          name: 'What AI models are available on KeyzAI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'KeyzAI provides access to multiple AI models including Qwen 3.8 Flash and DeepSeek V4 Flash. You can switch between models at any point during a conversation.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are chat histories saved?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Chat history syncs automatically across all devices you use, protected by your Google login session.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the PRD Builder?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The PRD Builder turns rough product ideas into complete Product Requirements Documents. You describe the idea, the AI clarifies details, recommends technology, and structures the product.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does streaming work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'KeyzAI streams AI responses as they are generated, so you can read along and stop at any point instead of waiting for completion.',
          },
        },
      ],
    }
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.textContent = JSON.stringify(faq, null, 2)
    document.head.appendChild(el)
    return () => el.remove()
  }, [])

  return (
    <div className="log-shell min-h-dvh bg-background text-foreground antialiased">
      <SessionNav />
      <main>
        <SessionOpen navigate={navigate} />
        <ChannelsBlock />
        <PrdRunBlock navigate={navigate} />
        <SourcesBlock />
      </main>
      <SessionClose />
    </div>
  )
}
