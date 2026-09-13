import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { useTheme } from '../lib/use-theme'
import { usePageMeta, SITE_NAME, SITE_DESC, faqSchema, injectJsonLd } from '../lib/seo'
import {
  Zap, ArrowRight, Sparkles, MessageSquare, MessageCircle, Code2, PenLine, ShieldCheck,
  BookOpen, Plus, Menu, X, Send, Check, Brain, Globe, Rocket, Sun, Moon,
} from 'lucide-react'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
]

const STATS = [
  { value: '<2s', label: 'Average response time' },
  { value: '1M+', label: 'Questions answered' },
  { value: '100+', label: 'Languages supported' },
  { value: '$0', label: 'Cost to get started' },
]

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Ask anything',
    desc: 'From quick facts to deep questions — get thoughtful, accurate answers in seconds.',
    span: 'md:col-span-2',
    prompt: 'What is compound interest, explained simply?',
  },
  {
    icon: PenLine,
    title: 'Write faster',
    desc: 'Draft emails, essays, and content with AI that matches your tone.',
    span: '',
    prompt: 'Write a friendly follow-up email to a client who went quiet.',
  },
  {
    icon: Code2,
    title: 'Debug code',
    desc: 'Paste a snippet, get fixes, explanations, and optimizations instantly.',
    span: '',
    code: true,
    prompt: 'Why does this throw "cannot read property of undefined"?',
  },
  {
    icon: BookOpen,
    title: 'Learn new topics',
    desc: 'Break down complex subjects into simple, digestible explanations.',
    span: '',
    prompt: 'Explain how neural networks learn, like I am a beginner.',
  },
  {
    icon: ShieldCheck,
    title: 'Private & secure',
    desc: 'Your conversations stay yours. No tracking, no data selling.',
    span: '',
  },
]

const STEPS = [
  {
    icon: Rocket,
    step: 'Step 1',
    title: 'Open the chat',
    desc: 'One click and you are in. No signup, no downloads, no credit card.',
  },
  {
    icon: MessageSquare,
    step: 'Step 2',
    title: 'Ask your question',
    desc: 'Type anything — code, ideas, homework, or that thing you keep googling.',
  },
  {
    icon: Zap,
    step: 'Step 3',
    title: 'Get instant answers',
    desc: 'Clear, accurate responses powered by advanced AI. Follow up as much as you want.',
  },
]

const FAQS = [
  {
    q: 'Is KeyzAI really free?',
    a: 'Yes. KeyzAI is completely free to use — no subscriptions, no hidden fees, no credit card required. Just open the chat and start asking.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'No. There is no signup, no email, and no password. Click "Start chatting" and you are talking to AI in seconds.',
  },
  {
    q: 'What kind of questions can I ask?',
    a: 'Anything. Brainstorm business ideas, debug code, plan a trip, understand a concept, draft an email, or just have a conversation. If you can type it, KeyzAI can help.',
  },
  {
    q: 'Is my conversation data private?',
    a: 'Your messages are processed to generate responses and are not used for advertising or sold to third parties. Your chats stay between you and the AI.',
  },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary shadow-sm">
        <Zap className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="font-heading text-base font-semibold tracking-tight text-foreground">KeyzAI</span>
    </div>
  )
}

function Navbar({ navigate, theme, toggleTheme }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button onClick={() => navigate('/chat')}>
            Start Chatting
            <ArrowRight />
          </Button>
        </div>
        <div className="md:hidden flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </nav>
      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Button onClick={() => navigate('/chat')} className="w-full mt-2">
            Start Chatting
            <ArrowRight />
          </Button>
        </div>
      )}
    </header>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3.5 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-typing-dot"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function ChatMock() {
  return (
    <div className="relative animate-fade-up" style={{ animationDelay: '0.3s' }}>
      <div className="absolute -top-10 -right-6 h-32 w-40 rounded-full bg-foreground/5 blur-3xl" />
      <div className="absolute -bottom-10 -left-6 h-32 w-40 rounded-full bg-foreground/5 blur-3xl" />

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
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-lg bg-primary px-3.5 py-2 text-sm text-primary-foreground">
              Explain quantum computing like I&apos;m 5
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="max-w-[85%] rounded-lg bg-muted px-3.5 py-2 text-sm leading-relaxed text-foreground">
              Imagine a coin spinning in the air — while it spins, it&apos;s both heads
              and tails at once. Quantum particles do that too, until you look at them!
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-lg bg-primary px-3.5 py-2 text-sm text-primary-foreground">
              Summarize it in one line
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="rounded-lg border border-border">
              <TypingDots />
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5">
            <span className="flex-1 text-sm text-muted-foreground">How can I help you today?</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Send className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -left-6 top-20 hidden animate-float items-center gap-2.5 rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur lg:flex">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
          <Zap className="h-3.5 w-3.5 text-foreground" />
        </div>
        <div>
          <p className="text-xs font-semibold leading-none text-foreground">&lt;2s</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">response time</p>
        </div>
      </div>
      <div className="absolute -right-5 bottom-16 hidden animate-float-delayed items-center gap-2.5 rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur lg:flex">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
          <Brain className="h-3.5 w-3.5 text-foreground" />
        </div>
        <div>
          <p className="text-xs font-semibold leading-none text-foreground">100+ topics</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">it knows deeply</p>
        </div>
      </div>
    </div>
  )
}

function Hero({ navigate }) {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div className="absolute inset-0 bg-dots [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]" />
      <div className="absolute left-1/2 top-0 h-72 w-[700px] -translate-x-1/2 rounded-full bg-foreground/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            <a
              href="#features"
              className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Introducing KeyzAI — chat smarter, faster
              <ArrowRight className="h-3 w-3" />
            </a>

            <h1
              className="animate-fade-up text-4xl font-bold leading-[1.08] tracking-tighter text-foreground sm:text-5xl md:text-6xl xl:text-7xl"
              style={{ animationDelay: '0.1s' }}
            >
              Ask anything.
              <br />
              Understand everything.
            </h1>

            <p className="animate-fade-up max-w-lg text-lg leading-relaxed text-muted-foreground" style={{ animationDelay: '0.2s' }}>
              KeyzAI is your instant AI companion. Brainstorm ideas, write code,
              learn new topics, and get answers in seconds.
            </p>

            <div className="animate-fade-up flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '0.25s' }}>
              <button
                onClick={() => navigate('/chat')}
                className="group inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Start chatting free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <a
                href="#how-it-works"
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                See how it works
              </a>
            </div>

            <div className="animate-fade-up flex flex-wrap gap-x-6 gap-y-2" style={{ animationDelay: '0.3s' }}>
              {['No signup required', 'Free forever', 'Powered by GPT'].map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden md:block">
            <ChatMock />
          </div>
        </div>
      </div>
    </section>
  )
}

function Stats() {
  return (
    <section className="border-y border-border">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="space-y-1.5 text-center">
              <p className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon: Icon, title, desc, span, prompt, onPrompt, children }) {
  const content = (
    <div className="relative">
      <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <h3 className="mb-1.5 text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
      {children}
      {prompt && (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-foreground">
          Try it <ArrowRight className="h-3 w-3" />
        </span>
      )}
    </div>
  )

  const className = `group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-left transition-colors hover:bg-accent/40 ${span}`

  if (prompt && onPrompt) {
    return (
      <button type="button" onClick={() => onPrompt(prompt)} className={className}>
        {content}
      </button>
    )
  }
  return <div className={className}>{content}</div>
}

function SkeletonBar({ className = '' }) {
  return <div className={`h-2.5 rounded-full bg-muted ${className}`} />
}

function Features({ navigate }) {
  const onPrompt = (p) => navigate(`/chat?q=${encodeURIComponent(p)}`)
  return (
    <section id="features" className="scroll-mt-20 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
          <span className="inline-block rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            Features
          </span>
          <h2 className="text-4xl font-bold tracking-tighter text-foreground md:text-5xl">
            One AI, endless possibilities
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to think, create, and learn faster — in one clean interface.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard {...FEATURES[0]} onPrompt={onPrompt}>
            <div className="mt-6 space-y-3">
              <div className="flex justify-end">
                <div className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground">
                  What is compound interest?
                </div>
              </div>
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-2 pt-1.5">
                  <SkeletonBar className="w-full" />
                  <SkeletonBar className="w-5/6" />
                  <SkeletonBar className="w-2/3" />
                </div>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard {...FEATURES[1]} onPrompt={onPrompt} />

          <FeatureCard {...FEATURES[2]} onPrompt={onPrompt}>
            <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-muted/50 p-3.5 font-mono text-xs leading-relaxed">
              <code>
                <span className="text-rose-600 dark:text-rose-400">const</span> <span className="text-blue-600 dark:text-blue-400">total</span> = (price, tax) =&gt; {'{'}{'\n'}
                {'  '}<span className="text-muted-foreground">// AI: tax should be multiplied, not added</span>{'\n'}
                {'  '}<span className="text-emerald-600 dark:text-emerald-400">return</span> price + price * tax;{'\n'}
                {'}'};
              </code>
            </pre>
          </FeatureCard>

          <FeatureCard {...FEATURES[3]} onPrompt={onPrompt} />
          <FeatureCard {...FEATURES[4]} onPrompt={onPrompt} />
        </div>
      </div>
    </section>
  )
}

function HowItWorks({ navigate }) {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-border py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
          <span className="inline-block rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            How it works
          </span>
          <h2 className="text-4xl font-bold tracking-tighter text-foreground md:text-5xl">
            Answers in three steps
          </h2>
          <p className="text-lg text-muted-foreground">
            From zero to your first answer in under ten seconds.
          </p>
        </div>

        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          <div className="absolute left-[16%] right-[16%] top-6 hidden h-px bg-border md:block" />
          {STEPS.map((item) => (
            <div key={item.step} className="relative space-y-4 text-center">
              <div className="relative mx-auto w-fit">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card shadow-sm">
                  <item.icon className="h-5 w-5 text-foreground" />
                </div>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{item.step}</p>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">{item.title}</h3>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button
            onClick={() => navigate('/chat')}
            className="group inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Try it now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </section>
  )
}

function FAQ({ navigate }) {
  return (
    <section id="faq" className="relative scroll-mt-20 overflow-hidden py-24 lg:py-32">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[1fr,1.35fr] lg:gap-20">
        {/* Left: heading + support card */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="space-y-4">
            <span className="inline-block rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              FAQ
            </span>
            <h2 className="text-4xl font-bold tracking-tighter text-foreground md:text-5xl">
              Frequently asked questions
            </h2>
            <p className="max-w-md text-lg text-muted-foreground">
              Everything you need to know about KeyzAI. Can&apos;t find your answer? Just ask —
              the AI is always happy to help.
            </p>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-2xl border border-border bg-card p-6">
            <div className="absolute inset-0 bg-dots opacity-50 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black,transparent)]" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                <MessageCircle className="h-5 w-5 text-foreground" />
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
                    Still have questions?
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Get instant answers from the AI — no wait time, no ticket queue, available 24/7.
                  </p>
                </div>
                <Button onClick={() => navigate('/chat')} size="sm">
                  Start a chat
                  <ArrowRight />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: accordion */}
        <div className="space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 open:border-primary/30 open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition-colors hover:bg-accent/40 [&::-webkit-details-marker]:hidden">
                <span className="font-heading text-sm font-semibold text-foreground md:text-base">
                  {item.q}
                </span>
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted transition-all duration-300 group-open:rotate-45 group-open:border-primary/40 group-open:bg-primary group-open:text-primary-foreground">
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </summary>

              <div className="px-5 pb-5">
                <div className="h-px bg-border" />
                <p className="pt-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA({ navigate }) {
  return (
    <section className="px-6 pb-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border bg-card">
        {/* Layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-dots opacity-50 [mask-image:radial-gradient(ellipse_65%_90%_at_50%_0%,black,transparent)]" />
        <div className="absolute left-1/2 top-0 h-56 w-[560px] -translate-x-1/2 rounded-full bg-primary/20 blur-[110px]" />

        {/* Floating decorative chips */}
        <div className="pointer-events-none absolute -left-4 top-16 hidden h-12 w-12 animate-float items-center justify-center rounded-2xl border border-border bg-background/80 shadow-lg backdrop-blur lg:flex">
          <Zap className="h-5 w-5 text-foreground" />
        </div>
        <div className="pointer-events-none absolute right-8 top-24 hidden h-14 w-14 animate-float-delayed items-center justify-center rounded-2xl border border-border bg-background/80 shadow-lg backdrop-blur lg:flex">
          <MessageCircle className="h-6 w-6 text-foreground" />
        </div>
        <div className="pointer-events-none absolute bottom-14 left-20 hidden h-10 w-10 animate-float items-center justify-center rounded-xl border border-border bg-background/80 shadow-lg backdrop-blur lg:flex" style={{ animationDelay: '0.8s' }}>
          <Sparkles className="h-4 w-4 text-foreground" />
        </div>

        <div className="relative mx-auto max-w-3xl px-8 py-20 text-center lg:py-28">
          {/* Icon with pulse ring */}
          <div className="relative mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary/40" />
            <Sparkles className="relative h-7 w-7 text-primary-foreground" />
          </div>

          <span className="mb-5 inline-block rounded-full border border-border bg-background/60 px-3.5 py-1 text-xs font-medium text-muted-foreground">
            Ready when you are
          </span>

          <h2 className="text-4xl font-bold leading-tight tracking-tighter text-foreground md:text-5xl">
            Meet your new
            <br />
            <span className="inline-block rounded-xl bg-primary/10 px-3 py-1">
              thinking partner
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground">
            Join thousands asking smarter questions. It takes ten seconds to start.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/chat')}
              className="group inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Start chatting — it&apos;s free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              See how it works
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              No signup required
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Free forever
            </span>
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              Works on any device
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-12 flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-xs space-y-4">
            <Logo />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your instant AI companion for answers, ideas, and everything in between.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Product</p>
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href} className="block text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </a>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Company</p>
              {['Terms', 'Privacy', 'Contact'].map((label) => (
                <a key={label} href="#" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {label}
                </a>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Resources</p>
              {['OpenAI Docs', 'Status', 'Changelog'].map((label) => (
                <a key={label} href="#" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">© 2026 KeyzAI. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Powered by OpenAI · Built with React &amp; Tailwind</p>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
  const [theme, setTheme] = useTheme()
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  usePageMeta({ title: SITE_NAME, description: SITE_DESC, path: '/' })

  useEffect(() => {
    injectJsonLd(faqSchema(FAQS))
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Navbar navigate={navigate} theme={theme} toggleTheme={toggleTheme} />
      <main>
        <Hero navigate={navigate} />
        <Stats />
        <Features navigate={navigate} />
        <HowItWorks navigate={navigate} />
        <FAQ navigate={navigate} />
        <CTA navigate={navigate} />
      </main>
      <Footer />
    </div>
  )
}
