---
version: 1
slug: "src-app-locale-page-tsx"
primary_target: "src/app/[locale]/page.tsx"
related_targets: ["src/app/[locale]/matches/page.tsx"]
---

# Seatigo — whole-site redesign

Scope: every route (homepage = Persuade; matches, match detail/ticket comparison, clubs, competitions, static pages = Operate). Audience: European fans finding a fixture and comparing real seller offers, often abroad, often on a phone. Action: search → compare → choose → external seller via /go.

Constraint from the brief: the user asked not to be shown design choices; the assigned direction was built without a decision round. No image generation on this machine: code-led.

## Direction contract

THESIS: Seatigo is the season's sticker album. Every fixture is a slot on a printed page; a fixture with real offers is a sticker stuck in, one without is an empty numbered slot that is still on the page. Refuses the category default: dark stadium-photo hero, neon-green accent, rows of identical cards.

OWN-WORLD: Album ultramarine page fields carrying 30–60% of Persuade surfaces, cool paper ground on Operate pages, white die-cut slots with a corner tab, ink near-black navy type. Condensed heavy caps (Archivo, width axis) for names, numerals and headlines; the same family at normal width for UI. Stickers lift on a soft offset shadow; empty slots are dashed outlines. One foil: only the lowest price wears it. Focus and selection on blue are signal yellow.

STORY: In one glance the visitor sees real upcoming fixtures as stickers with real "from" prices, types a club into the label strip, opens a fixture page, reads which sellers have what, and leaves knowing exactly which seller they are going to.

FIRST VIEWPORT: Full-width ultramarine album page. Left two-thirds: "Find your Seat" in condensed caps at ~7–9vw, one line of subcopy, the working search as a white label strip directly under it. Right third (below on mobile, as a horizontal sheet): a loose sheet of 3–4 real fixture stickers (crests, date tab, foil "from" price) at slight angles, each a link. Header sits on the blue field.

FORM: assigned candidate 6 of 7 (sticker album), raised by: teletext (every slot carries a stable address: date tab on fixtures, country code on clubs); airport wayfinding (outbound step always states "You'll continue to <seller>" as one plain band); quilt atlas (every price is seamed to its seller name inline); indoor sun (one ground colour committed across whole fields, not scattered accents); ASCII grid (one slot grid governs every listing); vertical feed (the fixture owns the match page's first viewport). seed:13164e47567619c1

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
