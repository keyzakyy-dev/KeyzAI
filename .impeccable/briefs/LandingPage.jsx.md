# Surface Brief: LandingPage.jsx

## Direction Contract

**THESIS:** The landing is an instrument panel, not a brochure. The hero opens as a row of VU meters — each one a product channel — and on entrance all needles sweep into yellow together, a chorus-hit moment that signals the product is alive. Content lives in the meter faces and their strip labels. Navigation sits above as channel numbers. The page proves the product's responsiveness before it ever says a word about it.

**OWN-WORLD:** Obsidian ground (#0a0a0a), circuit yellow (#facc15) for active state, linen white (#f5f5f4) for text. Space Grotesk for display, IBM Plex Sans for meter labels and chrome. Features rendered as analog meter faces with animated needles — not decorative, each one maps to a real product capability. The VU bridge is the hero's central artifact; the rest of the page inherits the meter language (strip labels, channel numbers, scale markings).

**STORY:** A professional visitor arrives cold. Within the first viewport they see an instrument panel come alive — needles sweeping, channels lighting. They understand: this is fast, responsive, multi-channel. By the time they reach the features section, each VU meter has a label telling what it does. The PRD Builder section continues the metaphor as "specialized instruments." The model list becomes a channel selector strip at the bottom.

**FIRST VIEWPORT:** Full-bleed obsidian. Top: thin strip-label nav (channel numbers). Center: large headline "All channels. One mix." in Space Grotesk, yellow on the key word. Below headline: the VU meter bridge — 5 meters (Chat, Code, Write, Brain, Sync), each with a face, scale, and needle. On load, all needles sweep from rest (-45°) to active (35°) in staggered sequence (100ms apart). Below meters: two CTA buttons (yellow primary, outlined secondary). Bottom strip: model ticker as "Input sources" label.

**FORM:** Code-led build. Vite + React + Tailwind. VU meters rendered as React components with CSS-based needle animation (no canvas needed for the static render; use CSS transforms). Features section reuses meter faces as channel cards. PRD Builder continues with instrument-themed step indicators. Model list uses a simplified ticker strip. Footer is a signal log.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md (already written), and every shipping raster carrying its provenance.
