# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Professionals and creators who use AI daily for coding, research, writing, and complex problem-solving. They need tools that respect their workflow, not distractions.

## Product Purpose

KeyzAI is two products:

1. **KeyzAI Chat** — a production-grade AI chat interface with streaming responses, message-tree branching (edit/regenerate), cross-device cloud sync, and interactive option cards. It exists to give professionals a reliable, fast, deeply functional AI companion they can return to every day.
2. **KeyzAI Landing** — a marketing surface that persuades visitors to try KeyzAI Chat. It earns attention through demonstration, not hype.

Success means: chat works end-to-end with zero crashes, first token under 2 seconds, and visitors to the landing page understand what KeyzAI is and why it matters within seconds.

## Positioning

KeyzAI Chat is distinguished by its message-tree architecture: users can edit any message in a conversation and regenerate forward, creating branches of thought that persist across devices. This is not a linear chat log — it is a living document of reasoning that grows as you explore. Competitors offer threads; KeyzAI offers trees.

The landing page proves this through interactive demonstration, not claims.

## Operating Context

- Used on desktop browsers (primary) and mobile (secondary).
- Developers, researchers, and creators work in dark-mode environments; the app defaults to dark.
- Conversations are long-running (30+ messages typical); users return over days or weeks.
- Sync across devices is a core expectation — data must be there when they switch.
- The landing page is viewed by cold traffic (Google search, social, referrals) who have never heard of KeyzAI.

## Capabilities and Constraints

**Confirmed capabilities:**
- Streaming chat via SSE relay (Cloudflare Worker → OpenAI-compatible API)
- Message-tree editing and regeneration with branch navigation
- Interactive option cards (model-emitted JSON renders as clickable choices)
- Google sign-in with session JWT, cross-device sync via D1
- LocalStorage fallback for offline access
- Conversation export/import as JSON backup
- PrdBuilder — a separate surface for structured product requirements documentation
- Theme switching (dark/light) with smooth fade transition
- MeshCanvas hexagonal background animation

**Technical constraints:**
- Free-tier hosting only (Vercel + Cloudflare free)
- LLM key stored server-side only (Cloudflare secret)
- Input validation at worker boundary (message ≤2000 chars, transcript ≤40 messages)
- Timeouts: 30s non-stream, 120s stream
- No user passwords stored; auth via Google OIDC

## Brand Commitments

- **Name:** KeyzAI
- **Tone:** Premium, sleek, professional. No hype, no gamification, no cartoonish friendliness.
- **Visual identity:** Dark-first, near-black backgrounds (`--background: 0 0% 4%`), stone neutrals, yellow accent (`#facc15` / `yellow-400`) used sparingly for chrome and active states. TUI-inspired chat panels with terminal aesthetic. Hexagonal mesh background patterns.
- **Typography:** Inter for UI, Space Grotesk for headings, Lora for serif accents.
- **Landing page aesthetic:** Architecture-draw line animations, feature grid with clip-path reveals, marquee testimonial bands, mockup chat interface with hex mesh behind it.

## Evidence on Hand

- Full PRD (`PRD.md`, v2.1, dated 2026-09-17)
- Landing page screenshot (`light-preview.png`)
- All source code in `src/` and `worker/`
- Passing test suite (`npm test`)
- Live deployment on Vercel + Cloudflare

**Absences to respect:** No real customer testimonials, no case studies, no pricing page (product is free), no usage benchmarks against competitors. These must not be invented for the landing page.

## Product Principles

1. **Demonstrate, don't claim.** Show the interface doing its job — the branching chat, the streaming response, the option cards — rather than describing features in adjectives.
2. **Professional grade, not toy-grade.** Zero compromises on polish. Every interaction has considered state: loading, error, empty, partial. Animations are purposeful, never decorative.
3. **Dark by default, light when needed.** The primary context is a professional working late or in a dim environment. Light mode is a courtesy, not an afterthought.
4. **Trees over threads.** The branching conversation model is the core differentiator; every design decision should make it more legible, not less.
5. **Free tier dignity.** Constraints (rate limits, storage) should never be visible to the user. The experience should feel unlimited.
