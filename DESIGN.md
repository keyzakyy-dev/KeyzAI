---
name: KeyzAI
description: Professional AI companion with terminal aesthetic and tree-branching conversations.
colors:
  primary: "#f5f5f4"
  primary-deep: "#e7e5e4"
  accent: "#facc15"
  accent-dim: "#ca8a04"
  neutral-bg: "#0a0a0a"
  neutral-surface: "#101010"
  neutral-border: "#2e2e2e"
  neutral-muted: "#a8a29e"
  neutral-text: "#f5f5f4"
  destructive: "#dc2626"
typography:
  display:
    fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.25rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'IBM Plex Sans', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.08em"
    textTransform: "uppercase"
  label-tiny:
    fontFamily: "'IBM Plex Sans', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.08em"
    textTransform: "uppercase"
  mono:
    fontFamily: "'IBM Plex Sans', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.8125rem"
    lineHeight: 1.5
rounded:
  sm: "2px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    size: "h-11 text-sm font-medium"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    size: "h-9 text-sm font-medium"
    border: "1px solid hsl(var(--foreground)/0.15)"
  tui-panel:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-text}"
    rounded: "6px"
    border: "1px solid hsl(var(--foreground)/0.16)"
  tui-tab-active:
    backgroundColor: "{colors.accent}"
    textColor: "#0a0a0a"
    rounded: "{rounded.sm}"
  tui-inset-title:
    fontFamily: "{typography.label.fontFamily}"
    fontSize: "11px"
    color: "{colors.neutral-muted}"
    letterSpacing: "0.08em"
    textTransform: "uppercase"
---

# Design System: KeyzAI

## Overview

**Creative North Star: "The Midnight Workshop"**

A dark-first professional workspace that feels like a well-organized toolbench at midnight: everything has its place, nothing is wasted, and the only light comes from the work itself. The terminal aesthetic is not nostalgia — it is a commitment to clarity over decoration. Every element earns its pixels. Yellow appears sparingly, like a single illuminated control on an otherwise matte surface, marking only what is active, selected, or complete.

The system balances two worlds: the chat app (dense, functional, TUI-terminal) and the landing page (spacious, architectural, demonstration-driven). They share a palette but diverge in density — the app is a workspace, the landing is a showcase.

**Key Characteristics:**
- Near-black backgrounds with stone-gray tonal layering
- Yellow accent used exclusively for active/selected/completed states (≤10% of screen area)
- Terminal-inspired panels with inset labels and monospace chrome
- Hexagonal mesh as structural metaphor, not decoration
- Purposeful motion: scroll reveals, line draws, breathing nodes — never decorative spin
- Dark by default; light mode is a courtesy override, not a parallel identity

## Colors

The palette is a warm stone family — neutral grays with a faint brown undertone — interrupted only by yellow when something demands attention.

### Primary
- **Linen White** (#f5f5f4): The foreground text and primary button fill. Used for body text, headings, and the main CTA background in dark mode. In light mode it becomes the paper base.

### Accent
- **Circuit Yellow** (#facc15): The active state color. Used for selected tabs, working indicators, checklist marks, and the primary button hover shadow glow. Reserved — never used for decorative fills or large areas.
- **Amber Deep** (#ca8a04): The quiet variant of yellow, used in gradients and low-emphasis accents (empty-state logos, dimmed badges).

### Neutral
- **Obsidian** (#0a0a0a): The primary background. A near-black with zero blue cast — this is warm darkness, not digital void.
- **Surface** (#101010): Panels, cards, and elevated surfaces sit one step above the background.
- **Border** (#2e2e2e): The `--border` token (hsl 0 0% 10.5%) for subtle panel edges and dividers.
- **Muted** (#a8a29e): Secondary text, labels, disabled states.
- **Foreground** (#f5f5f4): Primary text at 95% luminance.

### Named Rules
**The One Yellow Rule.** The yellow accent appears on no more than 10% of any given screen. Its rarity is its signal — when yellow appears, the user knows something is active, selected, or complete. If you find yourself reaching for yellow as decoration, reach for muted instead.

## Typography

**Display Font:** Space Grotesk (with Inter fallback)
**Body Font:** Inter (with system-ui fallback)
**Label/Mono Font:** IBM Plex Sans (with ui-monospace fallback)

**Character:** Three families, three jobs. Space Grotesk carries weight and attitude for headlines — its geometric quirks signal precision. Inter is invisible workhorse for body content. IBM Plex Sans anchors the TUI layer: inset titles, tab labels, monospace data. The pairing is technical without being cold.

### Hierarchy
- **Display** (500, clamp 2.5rem–4.5rem, 1.02 lh, −0.03em tracking): Hero headlines only. Used on the landing page for the main value proposition. Never in the chat app.
- **Headline** (500, clamp 1.75rem–2.25rem, 1.1 lh, −0.02em): Section headings on the landing page (Features, PRD Builder). The chat app uses a smaller title scale for conversation subjects.
- **Body** (400, 1rem, 1.6 lh): All prose, descriptions, chat messages. Max width 65ch for readability.
- **Label** (500, 0.75rem, 1.4 lh, 0.08em uppercase): TUI inset titles, tab labels, badge text. Always uppercase, always mono.
- **Mono** (400, 0.8125rem, 1.5 lh): Code blocks, terminal prompts, option card values. Uses IBM Plex Sans, not a true monospace, to maintain the brand's slight geometric warmth.

### Named Rules
**The Mono Rule.** Monospace type appears only in three contexts: TUI panel chrome (inset titles, tabs), code/output, and data labels. Never for body copy, never for decorative quotes. When in doubt, use Inter.

## Layout

The landing page uses a 12-column grid with a max-width of 1280px (max-w-7xl). Content is centered with 4px padding on mobile, 24px on desktop (px-4 sm:px-6). The chat app uses a full-viewport layout (100dvh) with a sidebar + main panel structure.

**Spacing rhythm:** 4px base unit. 8px for tight internal spacing, 16px for section gaps, 24–32px for major sections, 48px for hero-to-feature transitions. On desktop (≥1024px), the entire chat UI scales up 6% via `zoom: 1.06` with compensating height to maintain 100dvh fit.

**Responsive breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px). The landing page hero switches from single-column stacked on mobile to a 12-column split (5:7) on desktop, with the chat mockup hidden until lg.

## Elevation & Depth

Flat by default. Depth is conveyed through tonal layering (surface above background) and subtle borders (1px at 16% opacity), not shadows. The one exception is the primary button, which uses a directional shadow that intensifies on hover:

- **Default:** `0 8px 24px hsl(var(--foreground)/0.12)` — a soft lift
- **Hover:** `0 10px 28px hsl(var(--foreground)/0.18)` — deeper, with `translateY(-2px)`

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only in response to user action (hover, focus) or as a deliberate lift for primary CTAs. Dialogs and modals use opacity overlays, not elevation.

## Shapes

**Corner strategy:** Two radii dominate. `2px` (sm) for TUI elements — tabs, badges, working indicators — reinforcing the terminal aesthetic. `8px` (md, the `--radius` token) for buttons, inputs, cards, and panel corners. Square corners (`0`) are reserved exclusively for the hero chat mockup on the landing page, creating a deliberate contrast between the polished app and the architectural demonstration.

**Borders:** 1px solid at varying opacity levels. Panel borders use `hsl(var(--foreground)/0.16)` for the TUI chat; feature card borders use `hsl(var(--foreground)/0.25)` for the draw-on animation.

## Components

### Buttons
- **Primary:** 44px height (h-11), 20px horizontal padding, 8px radius, primary color fill, white text, font-medium. On hover: 1px lighter fill + `-translateY(2px)` + intensified shadow. Used for the main CTA ("Buka chat").
- **Outline:** Transparent fill, 1px border at `foreground/15`, same height and radius as primary. On hover: border brightens to `foreground/40`, background fills to `foreground/4`. Used for secondary actions.
- **Ghost:** No border, no fill. Text only with hover background at `foreground/6`. Used for navigation items and icon-only controls.
- **CTA (Landing specific):** 44px height, 20px padding, primary fill, shadow lift. The hero uses a larger variant (h-12, 24px padding, 15px text) at lg breakpoint.

### TUI Panels
- **Shape:** 6px radius, 1px border at `foreground/16`, background matches surface.
- **Inset title:** Absolute positioned at top-left, overlapping the border by 8px. Mono font, 11px, uppercase, muted color. Background matches panel background to create a "cut into the border" effect.
- **Tabs:** Active tab uses yellow fill with near-black text, 2px radius. Idle tab uses border outline with muted text.
- **Working indicator:** Yellow fill badge (same as active tab). Idle state: bordered badge with muted text.

### Feature Cards (Landing)
- **Shape:** Full-height flex column, no visible border at rest (border drawn via `::before` pseudo-element with clip-path animation).
- **Internal padding:** 16px mobile, 24px tablet, 32px desktop.
- **Icon container:** 36px (sm) / 40px (desktop) circle, text-foreground.
- **Badge:** Mono font, 11px, background-surface, muted text, 8px horizontal padding.
- **Animation:** `feature-line-draw` clip-path reveals the border on scroll entrance, staggered by 100ms per card.

### Inputs
- **Style:** 40px height, 8px radius, 1px border at `input` token, 12px horizontal padding.
- **Focus:** Ring at `ring` token (hsl 0 0% 62%), 2px width, 2px offset.
- **iOS safe:** Font-size forced to 16px on touch devices to prevent auto-zoom.

### Checkbox / Checkmark
- **Style:** 16–24px, stroke-width 2.5, yellow color (`yellow-600` dark / `yellow-400` light).
- **Usage:** Checklist items in hero, completed states, active indicators.

### Navigation
- **Header:** Fixed, transparent at rest, `background/95` with backdrop-blur on scroll or mobile menu open. 64px height. Hairline progress bar at top (2px, primary color, scaleX driven by scroll position).
- **Mobile menu:** Full-width panel, slide-in with fade-up animation (220ms). Close on Escape key or viewport resize past md breakpoint.

### MeshCanvas (Background)
- **Pattern:** Hexagonal tessellation rendered via WebGL/Canvas. Acts as ambient texture, not interactive element (pointer-events: none on the canvas layer).
- **Parallax:** Moves at 20% scroll speed on the landing hero.
- **Reduced motion:** Disabled entirely when `prefers-reduced-motion: reduce`.

## Do's and Don'ts

### Do:
- **Do** keep yellow rare. It signals state, not style.
- **Do** use mono type for TUI chrome only — inset titles, tabs, prompts, code.
- **Do** let the hex mesh serve as atmosphere, never as content.
- **Do** animate with purpose: reveal on scroll, draw on interaction, breathe on load.
- **Do** respect `prefers-reduced-motion` — disable all non-essential animations.
- **Do** use tonal layering (surface vs. background) for depth, not shadows.

### Don't:
- **Don't** use yellow for decorative elements, backgrounds, or large fills.
- **Don't** mix serif (Lora) into the chat app — it belongs on the landing page only for editorial accents.
- **Don't** add shadows to panels, cards, or TUI elements. Only the primary button gets elevation.
- **Don't** round the hero chat mockup corners — they stay square as a deliberate contrast.
- **Don't** use more than two type families in the chat app. Three on the landing is the maximum.
- **Don't** let the mesh canvas accept pointer events — it's texture, not interface.
